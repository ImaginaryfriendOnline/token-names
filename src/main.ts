import {
    ELLIPSIS,
    MODULE_ID,
    SETTINGS,
    TOKEN_CONFIG_SELECTORS,
    TOKEN_FLAGS,
    TOKEN_NAMES_CLASSES
} from "./constants";

interface AppliedFit {
    signature: string;
    fontSize: number;
    text: string;
    wordWrap: boolean;
}

const appliedFits = new WeakMap<Token, AppliedFit>();

function measureText(text: string, style: PIXI.TextStyle): PIXI.TextMetrics {
    // PixiJS v8 renamed TextMetrics -> CanvasTextMetrics; fall back defensively
    // in case fvtt-types or a future Foundry version doesn't expose the alias.
    const Metrics = (PIXI as unknown as { CanvasTextMetrics?: typeof PIXI.TextMetrics }).CanvasTextMetrics
        ?? PIXI.TextMetrics;
    return Metrics.measureText(text, style);
}

interface FitOptions {
    wordWrap: boolean;
    wordWrapWidth?: number;
    breakWords?: boolean;
}

export class NameplateFitter {
    static apply(token: Token): void {
        try {
            this._apply(token);
        } catch (error) {
            console.warn("token-names | Failed to fit nameplate for token", token, error);
        }
    }

    private static _apply(token: Token): void {
        const nameplate = token.nameplate;
        const document = token.document;
        if (!nameplate || !document) return;

        const name = (document.name ?? "").trim();
        if (!name) return;

        const enabled = game.settings.get(MODULE_ID, SETTINGS.ENABLED.key) as boolean;
        const colorByDisposition = game.settings.get(MODULE_ID, SETTINGS.COLOR_BY_DISPOSITION.key) as boolean;
        const disabledForToken = document.getFlag(MODULE_ID, TOKEN_FLAGS.DISABLE_AUTOFIT) === true;
        const shouldFit = enabled && !disabledForToken;

        if (!shouldFit && !colorByDisposition) return;

        const maxWidth = Math.max(1, token.w);
        const minFontSize = game.settings.get(MODULE_ID, SETTINGS.MIN_FONT_SIZE.key) as number;
        const shrinkStep = game.settings.get(MODULE_ID, SETTINGS.FONT_SHRINK_STEP.key) as number;

        const signature = [
            name,
            maxWidth,
            minFontSize,
            shrinkStep,
            shouldFit,
            colorByDisposition,
            document.disposition
        ].join("|");

        const style = nameplate.style as PIXI.TextStyle;
        const cached = appliedFits.get(token);

        // Foundry can rebuild/reset the nameplate's style and text on refresh
        // passes we don't control (this happens repeatedly during a scene's
        // initial load). Only skip recomputation if our last output is still
        // actually the thing on screen — otherwise a stale-but-matching
        // signature would make us silently leave core's reset (oversized)
        // default in place.
        const stillInEffect =
            cached !== undefined &&
            cached.signature === signature &&
            style.fontSize === cached.fontSize &&
            nameplate.text === cached.text &&
            style.wordWrap === cached.wordWrap;

        if (stillInEffect) return;

        if (shouldFit) this._fit(nameplate, name, maxWidth, minFontSize, shrinkStep);
        if (colorByDisposition) this._applyDispositionColor(token, nameplate);

        appliedFits.set(token, {
            signature,
            fontSize: style.fontSize as number,
            text: nameplate.text,
            wordWrap: style.wordWrap as boolean
        });
    }

    static refreshAll(): void {
        if (!canvas?.ready) return;
        for (const token of canvas.tokens?.placeables ?? []) {
            token.renderFlags.set({ refreshNameplate: true });
        }
    }

    private static _fit(
        nameplate: PIXI.Text,
        name: string,
        maxWidth: number,
        minFontSize: number,
        shrinkStep: number
    ): void {
        const baseStyle = nameplate.style as PIXI.TextStyle;
        const originalFontSize = baseStyle.fontSize as number;
        const clampedMinFontSize = Math.min(minFontSize, originalFontSize);
        const trial = baseStyle.clone();
        trial.wordWrap = false;

        let fontSize = originalFontSize;
        trial.fontSize = fontSize;
        let width = measureText(name, trial).width;

        while (width > maxWidth && fontSize > clampedMinFontSize) {
            fontSize = Math.max(clampedMinFontSize, fontSize - shrinkStep);
            trial.fontSize = fontSize;
            width = measureText(name, trial).width;
        }

        if (width <= maxWidth) {
            this._commit(nameplate, name, fontSize, { wordWrap: false });
            return;
        }

        fontSize = clampedMinFontSize;
        const hasWhitespace = /\s/.test(name);

        if (hasWhitespace) {
            trial.fontSize = fontSize;
            trial.wordWrap = true;
            trial.wordWrapWidth = maxWidth;
            trial.breakWords = false;
            let metrics = measureText(name, trial);

            if (metrics.maxLineWidth > maxWidth) {
                trial.breakWords = true;
                metrics = measureText(name, trial);
            }

            this._commit(nameplate, name, fontSize, {
                wordWrap: true,
                wordWrapWidth: maxWidth,
                breakWords: trial.breakWords
            });
            return;
        }

        const truncated = this._truncateToFit(name, maxWidth, trial);
        this._commit(nameplate, truncated, fontSize, { wordWrap: false });
    }

    private static _truncateToFit(name: string, maxWidth: number, trial: PIXI.TextStyle): string {
        trial.wordWrap = false;
        if (measureText(ELLIPSIS, trial).width > maxWidth) return ELLIPSIS;

        let lo = 0;
        let hi = name.length;
        let best = ELLIPSIS;

        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const candidate = name.slice(0, mid) + ELLIPSIS;
            if (measureText(candidate, trial).width <= maxWidth) {
                best = candidate;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        return best;
    }

    private static _commit(nameplate: PIXI.Text, text: string, fontSize: number, wrap: FitOptions): void {
        const style = nameplate.style as PIXI.TextStyle;
        style.fontSize = fontSize;
        style.wordWrap = wrap.wordWrap;
        style.wordWrapWidth = wrap.wordWrapWidth ?? 0;
        style.breakWords = wrap.breakWords ?? false;
        nameplate.text = text;
    }

    private static _applyDispositionColor(token: Token, nameplate: PIXI.Text): void {
        const style = nameplate.style as PIXI.TextStyle;
        style.fill = this._resolveDispositionColor(token);
    }

    private static _resolveDispositionColor(token: Token): number {
        const colors = CONFIG.Canvas.dispositionColors;
        const dispositions = CONST.TOKEN_DISPOSITIONS;
        const disposition = token.document.disposition;

        switch (disposition) {
            case dispositions.HOSTILE:
                return colors.HOSTILE;
            case dispositions.NEUTRAL:
                return colors.NEUTRAL;
            case dispositions.SECRET:
                return colors.SECRET;
            case dispositions.FRIENDLY:
            default:
                return token.document.hasPlayerOwner ? colors.PARTY : colors.FRIENDLY;
        }
    }
}

interface TokenConfigLike {
    document: {
        getFlag(scope: string, key: string): unknown;
    };
}

export function injectTokenConfigField(app: unknown, htmlElement: HTMLElement): void {
    if (htmlElement.querySelector("[data-token-names-field]")) return;

    const { document: sheetDocument } = app as TokenConfigLike;
    const checked = sheetDocument.getFlag(MODULE_ID, TOKEN_FLAGS.DISABLE_AUTOFIT) === true;

    const formGroup = document.createElement("div");
    formGroup.classList.add("form-group", TOKEN_NAMES_CLASSES.FORM_GROUP);
    formGroup.dataset.tokenNamesField = "true";

    const label = document.createElement("label");
    label.textContent = game.i18n.localize("token-names.TokenConfig.DisableAutoFit.Name");

    const fields = document.createElement("div");
    fields.classList.add("form-fields");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `flags.${MODULE_ID}.${TOKEN_FLAGS.DISABLE_AUTOFIT}`;
    input.dataset.dtype = "Boolean";
    input.checked = checked;
    fields.appendChild(input);

    const hint = document.createElement("p");
    hint.classList.add("hint");
    hint.textContent = game.i18n.localize("token-names.TokenConfig.DisableAutoFit.Hint");

    formGroup.append(label, fields, hint);

    const displayNameGroup = htmlElement
        .querySelector(`${TOKEN_CONFIG_SELECTORS.IDENTITY_TAB} ${TOKEN_CONFIG_SELECTORS.DISPLAY_NAME_SELECT}`)
        ?.closest(".form-group");

    if (displayNameGroup) {
        displayNameGroup.insertAdjacentElement("afterend", formGroup);
        return;
    }

    const identityTab = htmlElement.querySelector(TOKEN_CONFIG_SELECTORS.IDENTITY_TAB);
    const fallbackAnchor = identityTab ?? htmlElement.querySelector("form") ?? htmlElement;
    fallbackAnchor.appendChild(formGroup);
}

import "./hooks";
