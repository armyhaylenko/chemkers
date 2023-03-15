use crate::{
    bitboard::Bitboard, board::Board, board_move::Move, constants::Color,
    heuristic::CheckersHeuristic, move_generation::MoveGenerator,
};
use std::cmp;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub struct CheckersAi;

impl CheckersAi {
    pub fn alphabeta(
        bitboard: &Bitboard,
        color: Color,
        depth: u32,
        settings: u16,
        mut alpha: i16,
        mut beta: i16,
        forced_moves: Vec<Move>,
    ) -> i16 {
        if depth == 0 {
            return CheckersHeuristic::get_value_for_board(&bitboard, settings);
        }

        let moves = if forced_moves.len() == 0 {
            MoveGenerator::get_valid_moves(&bitboard, color, settings)
        } else {
            forced_moves
        };

        if matches!(color, Color::White) {
            let mut best_value = i16::MIN;

            for board_move in moves {
                let mut bitboard_after_move = bitboard.clone();
                bitboard_after_move.update_from_move(&board_move);
                best_value = cmp::max(
                    best_value,
                    Self::alphabeta(
                        &bitboard_after_move,
                        if board_move.forced_moves.len() > 0 {
                            color
                        } else {
                            Color::Black
                        },
                        depth - 1,
                        settings,
                        alpha,
                        beta,
                        board_move.forced_moves,
                    ),
                );

                if best_value > beta {
                    break;
                }

                alpha = cmp::max(alpha, best_value);
            }

            return best_value;
        } else {
            let mut best_value = i16::MAX;

            for board_move in moves {
                let mut bitboard_after_move = bitboard.clone();
                bitboard_after_move.update_from_move(&board_move);
                best_value = cmp::min(
                    best_value,
                    Self::alphabeta(
                        &bitboard_after_move,
                        if board_move.forced_moves.len() > 0 {
                            color
                        } else {
                            Color::White
                        },
                        depth - 1,
                        settings,
                        alpha,
                        beta,
                        board_move.forced_moves,
                    ),
                );

                if best_value < alpha {
                    break;
                }

                beta = cmp::min(beta, best_value);
            }

            return best_value;
        }
    }
}

#[wasm_bindgen]
impl CheckersAi {
    #[wasm_bindgen]
    pub fn get_heuristic_value_js(board: &Board, settings: u16) -> i16 {
        CheckersHeuristic::get_value_for_board(&board.bitboard, settings)
    }

    #[wasm_bindgen]
    pub fn get_best_move_alphabeta(
        board: &Board,
        color_to_move: Color,
        depth: u32,
        settings: u16,
        previous_move: Option<Move>,
    ) -> Option<Move> {
        let valid_moves = MoveGenerator::get_valid_moves(&board.bitboard, color_to_move, settings);
        let moves: Vec<Move> = match previous_move {
            Some(board_move) => {
                if board_move.forced_moves.len() > 0 {
                    board_move.forced_moves
                } else {
                    valid_moves
                }
            }
            _ => valid_moves,
        };

        if moves.len() == 0 {
            return None;
        }

        if moves.len() == 1 {
            return Some(moves[0].clone());
        }

        let pair: Vec<_> = moves
            .iter()
            .map(|board_move| {
                let mut board_after_move = board.bitboard.clone();
                board_after_move.update_from_move(&board_move);
                return (
                    board_move,
                    Self::alphabeta(
                        &board_after_move,
                        color_to_move.get_opposite(),
                        depth - 1,
                        settings,
                        i16::MIN,
                        i16::MAX,
                        board_move.forced_moves.clone(),
                    ),
                );
            })
            .collect();

        let best_pair = match color_to_move {
            Color::White => pair.iter().max_by_key(|(_, value)| value),
            Color::Black => pair.iter().min_by_key(|(_, value)| value),
            _ => None,
        };

        Some(match best_pair {
            Some((best_move, _)) => (**best_move).clone(),
            None => moves[0].clone(),
        })
    }
}
