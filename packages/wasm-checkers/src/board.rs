use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::{
    bitboard::Bitboard, board_move::Move, constants::Color, move_generation::MoveGenerator,
};

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Board {
    #[wasm_bindgen(skip)]
    pub bitboard: Bitboard,
    #[wasm_bindgen(skip)]
    pub move_history: Vec<Move>,
}

#[wasm_bindgen]
impl Board {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut board = Board {
            bitboard: Bitboard::new(),
            move_history: vec![],
        };

        board.init_default_state();
        board
    }

    #[wasm_bindgen]
    pub fn from_json(json: String) -> Self {
        serde_json::from_str(&json).unwrap()
    }

    #[wasm_bindgen]
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap()
    }

    #[wasm_bindgen()]
    pub fn init_default_state(&mut self) {
        self.bitboard = Bitboard::with_data([0x0000000000aa55aa, 0, 0x55aa550000000000, 0]);
    }

    #[wasm_bindgen()]
    pub fn get_pieces(&self) -> js_sys::Array {
        let mut pieces = Vec::new();

        for i in 0..64 {
            pieces.push(self.bitboard.get_piece(i));
        }

        pieces.into_iter().map(JsValue::from).collect()
    }

    #[wasm_bindgen]
    pub fn handle_move(&mut self, board_move: &Move) {
        self.bitboard.update_from_move(board_move);
        self.move_history.push(board_move.clone());
    }

    #[wasm_bindgen]
    pub fn get_winner(&self) -> Color {
        Color::Empty
    }

    #[wasm_bindgen]
    pub fn is_game_over(&self, settings: u16) -> bool {
        let white_pieces = self.bitboard.get_white();
        let black_pieces = self.bitboard.get_black();

        if white_pieces == 0 || black_pieces == 0 {
            return true;
        }

        let white_moves = MoveGenerator::get_valid_moves(&self.bitboard, Color::White, settings);
        let black_moves = MoveGenerator::get_valid_moves(&self.bitboard, Color::Black, settings);

        if white_moves.len() == 0 || black_moves.len() == 0 {
            return true;
        }

        false
    }
}
