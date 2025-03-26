use std::ops::Range;

use js_sys::Array;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::{
    bitboard::Bitboard,
    board::Board,
    board_move::Move,
    constants::{Color, MoveType, Piece},
    move_util::MoveUtil,
};

#[wasm_bindgen]
pub struct MoveGenerator;

impl MoveGenerator {
    pub fn get_moves_for_square(
        bitboard: &Bitboard,
        move_type: MoveType,
        square: u16,
        color: Color,
    ) -> Vec<Move> {
        let mut result = Vec::new();

        if !bitboard.is_color_occupied(color, square) {
            return result;
        }

        let piece = bitboard.get_piece_by_color(color, square).unwrap();
        let move_diagonals = MoveUtil::get_move_diagonals(piece);

        for diagonal in move_diagonals {
            let capture_end_squares =
                MoveUtil::get_capture_end_squares(&bitboard, move_type, piece, square, diagonal);
            let mut checked_captures: Vec<u16> = vec![];

            for (capture, end) in capture_end_squares {
                if checked_captures.len() > 1 {
                    break;
                }

                if !MoveUtil::is_diagonal_within_bounds(move_type, diagonal, square) {
                    continue;
                }

                if bitboard.is_occupied(end) {
                    match move_type {
                        MoveType::Attack => {
                            if bitboard.is_occupied(capture) {
                                break;
                            }
                        }
                        _ => {}
                    }

                    continue;
                }

                let captured_piece: Option<Piece> = match move_type {
                    MoveType::Attack => {
                        match bitboard.is_color_occupied(color.get_opposite(), capture) {
                            true => bitboard.get_piece(capture),
                            _ => None,
                        }
                    }
                    _ => None,
                };

                match move_type {
                    MoveType::Attack => {
                        if captured_piece.is_none() {
                            continue;
                        }
                        if !checked_captures.contains(&capture) {
                            checked_captures.push(capture);
                        }
                    }
                    _ => {}
                }

                let did_promote = !piece.king && MoveUtil::is_color_on_promotion_square(color, end);
                let mut bitboard_after_move = bitboard.clone();
                let piece_after_move = Piece {
                    color,
                    king: piece.king || did_promote,
                };

                bitboard_after_move.unset_square(piece, square);
                bitboard_after_move.set_square(piece_after_move, end);

                match move_type {
                    MoveType::Attack => {
                        bitboard_after_move.unset_square(captured_piece.unwrap(), capture);
                    }
                    _ => {}
                }

                let forced_moves = match move_type {
                    MoveType::Attack => {
                        if did_promote {
                            vec![]
                        } else {
                            Self::get_moves_for_square(
                                &bitboard_after_move,
                                MoveType::Attack,
                                end,
                                color,
                            )
                        }
                    }
                    _ => vec![],
                };

                result.push(Move {
                    start_square: square,
                    end_square: end,
                    moved_piece: piece,
                    moved_piece_after_move: piece_after_move,
                    captured_piece,
                    forced_moves,
                    bitboard_after_move,
                })
            }
        }

        result
    }

    pub fn get_moves_in_range(
        bitboard: &Bitboard,
        color: Color,
        move_type: MoveType,
        range: Range<u16>,
    ) -> Vec<Move> {
        let mut moves = Vec::new();

        for square in range {
            moves.push(Self::get_moves_for_square(
                bitboard, move_type, square, color,
            ));
        }

        moves.into_iter().flatten().collect()
    }

    pub fn get_valid_moves(bitboard: &Bitboard, color: Color) -> Vec<Move> {
        let attacking_moves = Self::get_moves_in_range(bitboard, color, MoveType::Attack, 0..64);
        if attacking_moves.len() > 0 {
            return attacking_moves;
        }
        let advancing_moves = Self::get_moves_in_range(bitboard, color, MoveType::Advance, 0..64);

        return advancing_moves;
    }
}

#[wasm_bindgen]
impl MoveGenerator {
    #[wasm_bindgen]
    pub fn get_valid_moves_js(board: &Board, color_to_move: Color) -> Array {
        Self::get_valid_moves(&board.bitboard, color_to_move)
            .into_iter()
            .map(JsValue::from)
            .collect()
    }
}
