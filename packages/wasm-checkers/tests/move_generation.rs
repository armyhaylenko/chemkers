use wasm_checkers::{
    bitboard::Bitboard,
    board::Board,
    constants::{Color, Piece},
    move_generation::MoveGenerator,
    settings::{CheckersSettingPreset, CheckersSettings},
};

#[test]
pub fn test_english_move_board_overflow() {
    let mut board = Board {
        bitboard: Bitboard::new(),
    };

    let white_piece = Piece {
        color: Color::White,
        king: false,
    };
    let black_piece = Piece {
        color: Color::Black,
        king: false,
    };

    board.bitboard.set_square(white_piece, 56);
    board.bitboard.set_square(white_piece, 58);
    board.bitboard.set_square(white_piece, 60);
    board.bitboard.set_square(white_piece, 62);

    board.bitboard.set_square(white_piece, 55);
    board.bitboard.set_square(white_piece, 53);
    board.bitboard.set_square(white_piece, 51);
    board.bitboard.set_square(white_piece, 49);

    assert!(MoveGenerator::get_valid_moves(&board.bitboard, Color::White, 0).len() == 0);

    board.bitboard.set_square(black_piece, 1);
    board.bitboard.set_square(black_piece, 3);
    board.bitboard.set_square(black_piece, 5);
    board.bitboard.set_square(black_piece, 7);

    board.bitboard.set_square(black_piece, 8);
    board.bitboard.set_square(black_piece, 10);
    board.bitboard.set_square(black_piece, 12);
    board.bitboard.set_square(black_piece, 14);

    assert!(MoveGenerator::get_valid_moves(&board.bitboard, Color::Black, 0).len() == 0)
}

#[test]
pub fn test_english_forced_moves() {
    let mut board = Board {
        bitboard: Bitboard::new(),
    };

    let white_piece = Piece {
        color: Color::White,
        king: false,
    };
    let black_piece = Piece {
        color: Color::Black,
        king: false,
    };

    board.bitboard.set_square(white_piece, 1);
    board.bitboard.set_square(black_piece, 10);
    board.bitboard.set_square(black_piece, 28);
    board.bitboard.set_square(black_piece, 44);
    board.bitboard.set_square(black_piece, 46);

    let moves = MoveGenerator::get_valid_moves(
        &board.bitboard,
        Color::White,
        CheckersSettings::from_preset(CheckersSettingPreset::EnglishVariation),
    );

    assert!(moves.len() == 1);
    assert!(moves[0].forced_moves.len() == 1);
    assert!(moves[0].forced_moves[0].forced_moves.len() == 2);
}
