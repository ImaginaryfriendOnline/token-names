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
    }

    interface FlagConfig {
        Token: {
            "token-names": {
                disableAutoFit?: boolean;
            };
        };
    }
}
