use js_sys::Array;
use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::{bitboard::Bitboard, constants::Piece};

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Move {
    pub start_square: u16,
    pub end_square: u16,
    pub captured_piece: Option<Piece>,
    pub moved_piece: Piece,
    pub moved_piece_after_move: Piece,
    #[wasm_bindgen(skip)]
    pub forced_moves: Vec<Move>,
    #[wasm_bindgen(skip)]
    pub bitboard_after_move: Bitboard,
}

#[wasm_bindgen]
impl Move {
    #[wasm_bindgen]
    pub fn from_json(json: String) -> Self {
        serde_json::from_str(&json).unwrap()
    }

    #[wasm_bindgen]
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_forced_moves_js(&self) -> Array {
        self.forced_moves
            .clone()
            .into_iter()
            .map(JsValue::from)
            .collect()
    }
}
