use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
    board_move::Move,
    constants::{Color, Piece},
    util::BitUtil,
};

#[wasm_bindgen]
#[derive(Copy, Clone, Serialize, Deserialize)]
pub struct Bitboard {
    data: [u64; 4],
}

impl Bitboard {
    pub fn new() -> Self {
        Bitboard { data: [0; 4] }
    }

    pub fn with_data(data: [u64; 4]) -> Self {
        Bitboard { data }
    }

    pub fn is_occupied(&self, square: u16) -> bool {
        BitUtil::is_set(self.get_occupied(), square)
    }

    pub fn is_color_occupied(&self, color: Color, square: u16) -> bool {
        match color {
            Color::White => BitUtil::is_set(self.get_white(), square),
            Color::Black => BitUtil::is_set(self.get_black(), square),
            _ => false,
        }
    }

    pub fn is_color_king(&self, color: Color, square: u16) -> bool {
        match color {
            Color::White => BitUtil::is_set(self.get_white_king(), square),
            Color::Black => BitUtil::is_set(self.get_black_king(), square),
            _ => false,
        }
    }

    pub fn get_occupied(&self) -> u64 {
        self.data[0] | self.data[1] | self.data[2] | self.data[3]
    }

    pub fn get_white(&self) -> u64 {
        self.data[0] | self.data[1]
    }

    pub fn get_white_king(&self) -> u64 {
        self.data[1]
    }

    pub fn get_black(&self) -> u64 {
        self.data[2] | self.data[3]
    }

    pub fn get_black_king(&self) -> u64 {
        self.data[3]
    }

    pub fn get_by_color(&self, color: Color) -> u64 {
        match color {
            Color::White => self.get_white(),
            Color::Black => self.get_black(),
            _ => 0,
        }
    }

    pub fn get_piece(&self, square: u16) -> Option<Piece> {
        if BitUtil::is_set(self.get_white(), square) {
            let color = Color::White;
            let king = self.is_color_king(color, square);
            return Some(Piece { color, king });
        }

        if BitUtil::is_set(self.get_black(), square) {
            let color = Color::Black;
            let king = self.is_color_king(color, square);
            return Some(Piece { color, king });
        }

        None
    }

    pub fn get_piece_by_color(&self, color: Color, square: u16) -> Option<Piece> {
        if !self.is_color_occupied(color, square) {
            return None;
        }

        let king = self.is_color_king(color, square);

        Some(Piece { color, king })
    }

    pub fn get_index(&mut self, piece: Piece) -> usize {
        match (piece.color, piece.king) {
            (Color::White, false) => 0,
            (Color::White, true) => 1,
            (Color::Black, false) => 2,
            (Color::Black, true) => 3,
            _ => panic!(),
        }
    }

    pub fn set_square(&mut self, piece: Piece, square: u16) {
        let index = self.get_index(piece);
        self.data[index] |= 1_u64 << square as u64;
    }

    pub fn unset_square(&mut self, piece: Piece, square: u16) {
        let index = self.get_index(piece);
        self.data[index] &= !(1_u64 << square as u64);
    }

    pub fn update_from_move(&mut self, board_move: &Move) {
        self.data = board_move.bitboard_after_move.data;
    }
}
