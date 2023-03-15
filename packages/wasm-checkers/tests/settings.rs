use wasm_checkers::settings::{CheckersSetting, CheckersSettings};

#[test]
pub fn test_settings_combine() {
    assert!(
        CheckersSettings::combine(vec![
            CheckersSetting::ForcedCapture,
            CheckersSetting::FlyingKings,
            CheckersSetting::PromotionMoveTermination
        ]) == 0b00001011
    )
}

#[test]
pub fn test_settings_contains() {
    let settings = CheckersSettings::combine(vec![
        CheckersSetting::ForcedCapture,
        CheckersSetting::FlyingKings,
        CheckersSetting::PromotionMoveTermination,
    ]);

    assert!(CheckersSettings::contains(
        settings,
        CheckersSetting::ForcedCapture
    ));
    assert!(CheckersSettings::contains(
        settings,
        CheckersSetting::FlyingKings
    ));
    assert!(CheckersSettings::contains(
        settings,
        CheckersSetting::PromotionMoveTermination
    ));
    assert!(!CheckersSettings::contains(
        settings,
        CheckersSetting::RegularCaptureBackwards
    ));
}
