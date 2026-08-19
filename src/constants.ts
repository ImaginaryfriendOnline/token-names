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
    },
    MAX_LINES: {
        key: "maxLines",
        name: "token-names.Settings.maxLines.Name",
        hint: "token-names.Settings.maxLines.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: 3,
        type: Number,
        range: { min: 1, max: 10, step: 1 }
    },
    REPLACE_ELEVATION_ICON: {
        key: "replaceElevationIcon",
        name: "token-names.Settings.replaceElevationIcon.Name",
        hint: "token-names.Settings.replaceElevationIcon.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: false,
        type: Boolean
    },
    TOOLTIP_SCALE: {
        key: "tooltipScale",
        name: "token-names.Settings.tooltipScale.Name",
        hint: "token-names.Settings.tooltipScale.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: 1,
        type: Number,
        range: { min: 0.5, max: 3, step: 0.1 }
    },
    TOOLTIP_ANCHOR: {
        key: "tooltipAnchor",
        name: "token-names.Settings.tooltipAnchor.Name",
        hint: "token-names.Settings.tooltipAnchor.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: "default",
        type: String,
        choices: {
            default: "token-names.Settings.tooltipAnchor.Choices.default",
            topLeft: "token-names.Settings.tooltipAnchor.Choices.topLeft",
            topCenter: "token-names.Settings.tooltipAnchor.Choices.topCenter",
            topRight: "token-names.Settings.tooltipAnchor.Choices.topRight",
            bottomLeft: "token-names.Settings.tooltipAnchor.Choices.bottomLeft",
            bottomCenter: "token-names.Settings.tooltipAnchor.Choices.bottomCenter",
            bottomRight: "token-names.Settings.tooltipAnchor.Choices.bottomRight",
            center: "token-names.Settings.tooltipAnchor.Choices.center"
        }
    },
    TOOLTIP_OFFSET_X: {
        key: "tooltipOffsetX",
        name: "token-names.Settings.tooltipOffsetX.Name",
        hint: "token-names.Settings.tooltipOffsetX.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: 0,
        type: Number,
        range: { min: -50, max: 50, step: 1 }
    },
    TOOLTIP_OFFSET_Y: {
        key: "tooltipOffsetY",
        name: "token-names.Settings.tooltipOffsetY.Name",
        hint: "token-names.Settings.tooltipOffsetY.Hint",
        scope: "world" as const,
        config: true,
        restricted: true,
        default: 0,
        type: Number,
        range: { min: -50, max: 50, step: 1 }
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
