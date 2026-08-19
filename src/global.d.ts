export {};

declare module "fvtt-types/configuration" {
    interface AssumeHookRan {
        init: never;
        ready: never;
    }

    interface SettingConfig {
        "token-names.enabled": boolean;
        "token-names.minFontSize": number;
        "token-names.fontShrinkStep": number;
        "token-names.colorByDisposition": boolean;
        "token-names.maxLines": number;
        "token-names.tooltipScale": number;
        "token-names.tooltipAnchor": string;
        "token-names.tooltipOffsetX": number;
        "token-names.tooltipOffsetY": number;
    }

    interface FlagConfig {
        Token: {
            "token-names": {
                disableAutoFit?: boolean;
            };
        };
    }
}
