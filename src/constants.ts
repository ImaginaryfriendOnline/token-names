export const MODULE_ID = "token-names";

export const SETTINGS = {
    ENABLED: {
        key: "enabled",
        name: "token-names.Settings.enabled.Name",
        hint: "token-names.Settings.enabled.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: true,
        type: Boolean
    },
    MIN_FONT_SIZE: {
        key: "minFontSize",
        name: "token-names.Settings.minFontSize.Name",
        hint: "token-names.Settings.minFontSize.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: 16,
        type: Number,
        range: { min: 8, max: 48, step: 1 }
    },
    FONT_SHRINK_STEP: {
        key: "fontShrinkStep",
        name: "token-names.Settings.fontShrinkStep.Name",
        hint: "token-names.Settings.fontShrinkStep.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: 2,
        type: Number,
        range: { min: 1, max: 8, step: 1 }
    },
    COLOR_BY_DISPOSITION: {
        key: "colorByDisposition",
        name: "token-names.Settings.colorByDisposition.Name",
        hint: "token-names.Settings.colorByDisposition.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: false,
        type: Boolean
    }
} as const;

export const TOKEN_FLAGS = {
    DISABLE_AUTOFIT: "disableAutoFit"
} as const;

export const TOKEN_CONFIG_SELECTORS = {
    IDENTITY_TAB: '[data-tab="identity"]',
    DISPLAY_NAME_SELECT: 'select[name="displayName"]'
} as const;

export const TOKEN_NAMES_CLASSES = {
    FORM_GROUP: "token-names-form-group"
} as const;

export const ELLIPSIS = "…";
