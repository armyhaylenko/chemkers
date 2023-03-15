use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::util::BitUtil;

#[repr(u16)]
#[wasm_bindgen]
#[derive(PartialEq, Serialize, Deserialize)]
pub enum CheckersSetting {
    // Shouldn't be used
    Default = 0,
    // All captures are forced
    ForcedCapture = 1,
    // Kings can move any number of squares diagonally
    FlyingKings = 2,
    // Regular pieces can capture backwards
    RegularCaptureBackwards = 4,
    // Upon king promotion the next move is terminated, even if it was a sequence of captures
    PromotionMoveTermination = 8,
}

#[wasm_bindgen]
pub enum CheckersSettingPreset {
    // A preset of settings for the `English draughts` variation
    EnglishVariation,
    // A preset of settings for the `Russian checkers` variation
    RussianVariation,
}

#[wasm_bindgen]
pub struct CheckersSettings;

impl CheckersSettings {
    pub fn combine(settings: Vec<CheckersSetting>) -> u16 {
        let mut result = 0;

        for setting in settings {
            result |= setting as u16;
        }

        result
    }

    pub fn split(settings: u16) -> Vec<CheckersSetting> {
        let mut result = vec![];

        for index in 0..=4 {
            if BitUtil::is_set(settings as u64, index) {
                result.push(Self::from_index(1 << index))
            }
        }

        result
    }

    pub fn contains(settings: u16, setting: CheckersSetting) -> bool {
        Self::split(settings).contains(&setting)
    }

    pub fn from_index(index: u16) -> CheckersSetting {
        match index {
            1 => CheckersSetting::ForcedCapture,
            2 => CheckersSetting::FlyingKings,
            4 => CheckersSetting::RegularCaptureBackwards,
            8 => CheckersSetting::PromotionMoveTermination,
            _ => CheckersSetting::Default,
        }
    }
}

#[wasm_bindgen]
impl CheckersSettings {
    #[wasm_bindgen]
    pub fn combine_js(settings: JsValue) -> u16 {
        Self::combine(serde_wasm_bindgen::from_value(settings).unwrap_or(vec![]))
    }

    #[wasm_bindgen]
    pub fn contains_js(settings: u16, setting: CheckersSetting) -> bool {
        CheckersSettings::contains(settings, setting)
    }

    #[wasm_bindgen]
    pub fn from_preset(preset: CheckersSettingPreset) -> u16 {
        match preset {
            CheckersSettingPreset::EnglishVariation => CheckersSettings::combine(vec![
                CheckersSetting::ForcedCapture,
                CheckersSetting::PromotionMoveTermination,
            ]),
            CheckersSettingPreset::RussianVariation => CheckersSettings::combine(vec![
                CheckersSetting::FlyingKings,
                CheckersSetting::RegularCaptureBackwards,
                CheckersSetting::PromotionMoveTermination,
            ]),
        }
    }
}
