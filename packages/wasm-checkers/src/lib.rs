pub mod bitboard;
pub mod board;
pub mod board_move;
pub mod constants;
pub mod move_generation;
pub mod move_util;

use std::panic;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(start)]
pub fn main_wasm() {
    init_panic_hook();
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}
