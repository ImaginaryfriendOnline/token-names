import { MODULE_ID, SETTINGS, TOKEN_FLAGS } from "./constants";
import { NameplateFitter, injectTokenConfigField } from "./main";
import { registerModuleSettings } from "./settings";

Hooks.once("init", () => {
    registerModuleSettings({
        [SETTINGS.ENABLED.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.MIN_FONT_SIZE.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.FONT_SHRINK_STEP.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.COLOR_BY_DISPOSITION.key]: () => NameplateFitter.refreshAll()
    });
});

Hooks.on("drawToken", (token: Token) => NameplateFitter.apply(token));
Hooks.on("refreshToken", (token: Token) => NameplateFitter.apply(token));

// A scene's initial load triggers several core-driven nameplate refresh
// passes in quick succession; force one more fit pass once things have
// settled so a scene switch doesn't leave stale/oversized nameplates.
Hooks.on("canvasReady", () => NameplateFitter.refreshAll());

Hooks.on("updateToken", (tokenDocument: TokenDocument, changes: object) => {
    const flagPath = `flags.${MODULE_ID}.${TOKEN_FLAGS.DISABLE_AUTOFIT}`;
    if (foundry.utils.hasProperty(changes, flagPath)) {
        tokenDocument.object?.renderFlags.set({ refreshNameplate: true });
    }
});

Hooks.on("renderTokenConfig", (app, htmlElement: HTMLElement) => injectTokenConfigField(app, htmlElement));
Hooks.on("renderPrototypeTokenConfig", (app, htmlElement: HTMLElement) => injectTokenConfigField(app, htmlElement));
