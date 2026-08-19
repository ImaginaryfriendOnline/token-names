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
        [SETTINGS.REPLACE_ELEVATION_ICON.key]: () => refreshAllTooltips(),
        [SETTINGS.TOOLTIP_SCALE.key]: () => refreshAllTooltips(),
        [SETTINGS.TOOLTIP_ANCHOR.key]: () => refreshAllTooltips(),
        [SETTINGS.TOOLTIP_OFFSET_X.key]: () => refreshAllTooltips(),
        [SETTINGS.TOOLTIP_OFFSET_Y.key]: () => refreshAllTooltips()
    });

    // Wrapping the real _refreshNameplate/_refreshTooltip methods (rather than
    // relying on the public refreshToken Hook + renderFlags.set(), which is
    // ticker-deferred and races against core's own cascading refreshes)
    // guarantees our changes run synchronously every time core actually
    // rebuilds the nameplate/tooltip.
    NameplateFitter.patchTokenPrototype();
    TooltipIconReplacer.patchTokenPrototype();
});

function forceTooltipRefresh(token: Token): void {
    (token as unknown as { _refreshTooltip: () => void })._refreshTooltip();
}

function refreshAllTooltips(): void {
    if (!canvas?.ready) return;
    for (const token of canvas.tokens?.placeables ?? []) {
        forceTooltipRefresh(token);
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

// core's own hover-triggered tooltip visibility toggle does not call
// _refreshTooltip - it only fires content/position/scale recomputation
// during an active drag - so without this, none of TooltipIconReplacer's
// work ever runs for a token that's only ever hovered, not dragged.
Hooks.on("hoverToken", (token: Token, hovered: boolean) => {
    if (hovered) forceTooltipRefresh(token);
});

Hooks.on("controlToken", (token: Token, controlled: boolean) => {
    if (controlled) forceTooltipRefresh(token);
});

Hooks.on("renderTokenConfig", (app, htmlElement: HTMLElement) => injectTokenConfigField(app, htmlElement));
Hooks.on("renderPrototypeTokenConfig", (app, htmlElement: HTMLElement) => injectTokenConfigField(app, htmlElement));
