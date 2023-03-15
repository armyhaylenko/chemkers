use crate::{
    bitboard::Bitboard,
    constants::{Color, MoveType, Piece},
    move_generation::MoveGenerator,
    settings::{CheckersSetting, CheckersSettings},
};

use rand::Rng;

pub struct CheckersHeuristic;

impl CheckersHeuristic {
    pub const PAWN_VALUE: i16 = 12;
    pub const KING_VALUE: i16 = 24;
    pub const FLYING_KING_VALUE: i16 = 36;

    pub const PROTECTING_SQUARE_VALUE: i16 = 1;
    pub const PROTECTING_KING_SQUARE_VALUE: i16 = 3;

    pub const PAWN_ADVANCE_VALUE: i16 = 2;

    pub fn get_value_for_piece(
        bitboard: &Bitboard,
        piece: &Piece,
        square: u16,
        settings: u16,
    ) -> i16 {
        let mut value: i16 = 0;
        let protecting_moves = MoveGenerator::get_moves_for_square(
            bitboard,
            MoveType::Advance,
            square,
            piece.color,
            settings,
        );

        value += if piece.king {
            if CheckersSettings::contains(settings, CheckersSetting::FlyingKings) {
                Self::FLYING_KING_VALUE
            } else {
                Self::KING_VALUE
            }
        } else {
            Self::PAWN_VALUE
        };

        match piece.color {
            Color::White => {
                for protecting_move in protecting_moves.iter() {
                    value += match protecting_move.end_square {
                        1 | 3 | 5 | 7 => Self::PROTECTING_KING_SQUARE_VALUE,
                        _ => Self::PROTECTING_SQUARE_VALUE,
                    }
                }
                value += (square / 8) as i16 * Self::PAWN_ADVANCE_VALUE;
            }
            Color::Black => {
                for protecting_move in protecting_moves.iter() {
                    value += match protecting_move.end_square {
                        56 | 58 | 60 | 62 => Self::PROTECTING_KING_SQUARE_VALUE,
                        _ => Self::PROTECTING_SQUARE_VALUE,
                    }
                }
                value += ((63 - square) / 8) as i16 * Self::PAWN_ADVANCE_VALUE;
            }
            _ => {}
        };

        value
    }

    pub fn get_value_for_board(bitboard: &Bitboard, settings: u16) -> i16 {
        let mut rng = rand::thread_rng();
        let mut value: i16 = 0;
        let random_component: i16 = rng.gen_range(-3..3);

        for (square, piece_option) in (0..64).map(|i| (i, bitboard.get_piece(i))) {
            value += match piece_option {
                Some(piece) => {
                    CheckersHeuristic::get_value_for_piece(&bitboard, &piece, square, settings)
                        * piece.color.get_score_multiplier()
                }
                None => 0,
            };
        }

        value + random_component
    }
}
