use crate::{
    bitboard::Bitboard,
    constants::{Color, MoveDiagonals, MoveType, Piece},
    settings::{CheckersSetting, CheckersSettings},
};

pub struct MoveUtil;

impl MoveUtil {
    pub fn get_move_diagonals(piece: Piece, move_type: MoveType, settings: u16) -> Vec<i16> {
        let every_diagonal = vec![
            MoveDiagonals::NORTH_WEST,
            MoveDiagonals::NORTH_EAST,
            MoveDiagonals::SOUTH_WEST,
            MoveDiagonals::SOUTH_EAST,
        ];

        if piece.king {
            return every_diagonal;
        }

        match move_type {
            MoveType::Attack => {
                if CheckersSettings::contains(settings, CheckersSetting::RegularCaptureBackwards) {
                    return every_diagonal;
                }
            }
            _ => {}
        }

        match piece.color {
            Color::White => vec![MoveDiagonals::NORTH_WEST, MoveDiagonals::NORTH_EAST],
            Color::Black => vec![MoveDiagonals::SOUTH_WEST, MoveDiagonals::SOUTH_EAST],
            _ => vec![],
        }
    }

    pub fn is_diagonal_within_bounds(move_type: MoveType, diagonal: i16, square: u16) -> bool {
        match move_type {
            MoveType::Advance => match diagonal {
                MoveDiagonals::NORTH_WEST | MoveDiagonals::NORTH_EAST => {
                    if square > 55 {
                        return false;
                    }
                }
                MoveDiagonals::SOUTH_WEST | MoveDiagonals::SOUTH_EAST => {
                    if square < 8 {
                        return false;
                    }
                }
                _ => {}
            },
            MoveType::Attack => match diagonal {
                MoveDiagonals::NORTH_WEST | MoveDiagonals::NORTH_EAST => {
                    if square > 47 {
                        return false;
                    }
                }
                MoveDiagonals::SOUTH_WEST | MoveDiagonals::SOUTH_EAST => {
                    if square < 16 {
                        return false;
                    }
                }
                _ => {}
            },
        }

        match move_type {
            MoveType::Advance => match diagonal {
                MoveDiagonals::NORTH_WEST | MoveDiagonals::SOUTH_WEST => {
                    if square % 8 == 7 {
                        return false;
                    }
                }
                MoveDiagonals::NORTH_EAST | MoveDiagonals::SOUTH_EAST => {
                    if square % 8 == 0 {
                        return false;
                    }
                }
                _ => {}
            },
            MoveType::Attack => match diagonal {
                MoveDiagonals::NORTH_WEST | MoveDiagonals::SOUTH_WEST => {
                    if square % 8 == 6 {
                        return false;
                    }
                }
                MoveDiagonals::NORTH_EAST | MoveDiagonals::SOUTH_EAST => {
                    if square % 8 == 1 {
                        return false;
                    }
                }
                _ => {}
            },
        }

        true
    }

    pub fn get_capture_end_squares(
        bitboard: &Bitboard,
        move_type: MoveType,
        settings: u16,
        piece: Piece,
        square: u16,
        diagonal: i16,
    ) -> Vec<(u16, u16)> {
        if !CheckersSettings::contains(settings, CheckersSetting::FlyingKings) || !piece.king {
            return match move_type {
                MoveType::Advance => vec![(square, (square as i16 + diagonal) as u16)],
                MoveType::Attack => vec![(
                    (square as i16 + diagonal) as u16,
                    (square as i16 + diagonal * 2) as u16,
                )],
            };
        }

        let mut possible_moves: Vec<(u16, u16)> = vec![];
        let mut capture_squares: Vec<u16> = vec![];
        let mut previous_square: u16 = square;
        let mut end_square = square as i16;

        loop {
            end_square += diagonal;

            if !(0..64).contains(&end_square) {
                break;
            }

            match move_type {
                MoveType::Advance => {
                    if bitboard.is_occupied(end_square as u16) {
                        break;
                    }
                }
                _ => {}
            }

            match move_type {
                MoveType::Advance => possible_moves.push((square, end_square as u16)),
                MoveType::Attack => {
                    if previous_square != square {
                        capture_squares.push(previous_square);

                        for capture_square in capture_squares.clone() {
                            possible_moves.push((capture_square, end_square as u16));
                        }
                    }
                }
            }

            previous_square = end_square as u16;

            match diagonal {
                MoveDiagonals::NORTH_WEST | MoveDiagonals::SOUTH_WEST => {
                    if end_square % 8 == 7 {
                        break;
                    }
                }
                MoveDiagonals::NORTH_EAST | MoveDiagonals::SOUTH_EAST => {
                    if end_square % 8 == 0 {
                        break;
                    }
                }
                _ => {}
            };
        }

        return possible_moves;
    }

    pub fn is_color_on_promotion_square(color: Color, square: u16) -> bool {
        match color {
            Color::White => (56..64).contains(&square),
            Color::Black => (0..8).contains(&square),
            _ => false,
        }
    }
}
