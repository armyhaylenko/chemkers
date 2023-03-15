use criterion::{black_box, criterion_group, criterion_main, Criterion};
use wasm_checkers::{
    ai::CheckersAi,
    board::Board,
    constants::Color,
    settings::{CheckersSettingPreset, CheckersSettings},
};

fn generate_best_move_russian(depth: u32) {
    let board = Board::new();

    CheckersAi::get_best_move_alphabeta(
        &board,
        Color::White,
        depth,
        CheckersSettings::from_preset(CheckersSettingPreset::RussianVariation),
        None,
    );
}

fn generate_best_move_english(depth: u32) {
    let board = Board::new();

    CheckersAi::get_best_move_alphabeta(
        &board,
        Color::White,
        depth,
        CheckersSettings::from_preset(CheckersSettingPreset::EnglishVariation),
        None,
    );
}

fn bench_move_generation(c: &mut Criterion) {
    let mut group = c.benchmark_group("Best move generation");

    group.sample_size(10);

    for i in 1..=9 {
        group.bench_with_input(format!("Russian-Variation, depth={i}"), &i, |b, i| {
            b.iter(|| generate_best_move_russian(black_box(*i)))
        });
    }

    for i in 1..=9 {
        group.bench_with_input(format!("English-Variation, depth={i}"), &i, |b, i| {
            b.iter(|| generate_best_move_english(black_box(*i)))
        });
    }

    group.finish();
}

criterion_group!(benches, bench_move_generation);
criterion_main!(benches);
