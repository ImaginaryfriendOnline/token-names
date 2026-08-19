import { MODULE_ID, SETTINGS, TOKEN_FLAGS } from "./constants";
import { NameplateFitter, TooltipIconReplacer, injectTokenConfigField } from "./main";
import { registerModuleSettings } from "./settings";

Hooks.once("init", () => {
    registerModuleSettings({
        [SETTINGS.ENABLED.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.MIN_FONT_SIZE.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.FONT_SHRINK_STEP.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.COLOR_BY_DISPOSITION.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.MAX_LINES.key]: () => NameplateFitter.refreshAll(),
        [SETTINGS.REPLACE_ELEVATION_ICON.key]: () => refreshAllTooltips()
    });

    // Wrapping the real _refreshNameplate/_refreshTooltip methods (rather than
    // relying on the public refreshToken Hook + renderFlags.set(), which is
    // ticker-deferred and races against core's own cascading refreshes)
    // guarantees our changes run synchronously every time core actually
    // rebuilds the nameplate/tooltip.
    NameplateFitter.patchTokenPrototype();
    TooltipIconReplacer.patchTokenPrototype();
});

function refreshAllTooltips(): void {
    if (!canvas?.ready) return;
    for (const token of canvas.tokens?.placeables ?? []) {
        (token as unknown as { _refreshTooltip: () => void })._refreshTooltip();
    }
}

// Safety net for the very first paint; a no-op if the prototype wrap above
// already handled it during the same draw cycle.
Hooks.on("drawToken", (token: Token) => NameplateFitter.apply(token));

Hooks.on("updateToken", (tokenDocument: TokenDocument, changes: object) => {
    const flagPath = `flags.${MODULE_ID}.${TOKEN_FLAGS.DISABLE_AUTOFIT}`;
    if (foundry.utils.hasProperty(changes, flagPath) && tokenDocument.object) {
        NameplateFitter.apply(tokenDocument.object, true);
    }
});

Hooks.on("renderTokenConfig", (app, htmlElement: HTMLElement) => injectTokenConfigField(app, htmlElement));
Hooks.on("renderPrototypeTokenConfig", (app, htmlElement: HTMLElement) => injectTokenConfigField(app, htmlElement));
