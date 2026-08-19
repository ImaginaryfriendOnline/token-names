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
    fullName: string;
    truncated: boolean;
}

interface FitResult {
    truncated: boolean;
    ellipsisRect: PIXI.Rectangle | null;
}

const appliedFits = new WeakMap<Token, AppliedFit>();
const hoverBoundNameplates = new WeakSet<PIXI.Text>();
const hoveringTokens = new WeakSet<Token>();

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
    static patchTokenPrototype(): void {
        const TokenClass = foundry.canvas.placeables.Token;
        const proto = TokenClass.prototype as unknown as { _refreshNameplate: (...args: unknown[]) => unknown };
        const original = proto._refreshNameplate;

        proto._refreshNameplate = function (this: Token, ...args: unknown[]): unknown {
            const result = original.apply(this, args);
            NameplateFitter.apply(this);
            return result;
        };
    }

    static apply(token: Token, force = false): void {
        try {
            this._apply(token, force);
        } catch (error) {
            console.warn("token-names | Failed to fit nameplate for token", token, error);
        }
    }

    private static _apply(token: Token, force: boolean): void {
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

        // Applied unconditionally (cheap) rather than gated behind the fit
        // cache below: core resets the nameplate's fill on every refresh, and
        // gating it would mean the color only sticks until the next refresh
        // pass whose fontSize/text/wordWrap happen to still match the cache.
        if (colorByDisposition) this._applyDispositionColor(token, nameplate);

        if (!shouldFit) return;

        // A core refresh firing while the pointer is still over the ellipsis
        // must not clobber the temporary full-name reveal back to truncated
        // text mid-hover; _bindHoverReveal restores it on pointerout instead.
        if (hoveringTokens.has(token)) return;

        // Foundry scales the nameplate PIXI.Text object (e.g. relative to the
        // scene's grid size), but style.fontSize/measureText operate in the
        // nameplate's local, pre-scale space. Convert token.w into that same
        // local space, or the fit target is wrong by the scale factor on any
        // scene whose grid size isn't the nameplate's baseline.
        const maxWidth = Math.max(1, token.w);
        const nameplateScale = Math.abs(nameplate.scale?.x || 1) || 1;
        const localMaxWidth = Math.max(1, maxWidth / nameplateScale);
        const minFontSize = game.settings.get(MODULE_ID, SETTINGS.MIN_FONT_SIZE.key) as number;
        const shrinkStep = game.settings.get(MODULE_ID, SETTINGS.FONT_SHRINK_STEP.key) as number;
        const maxLines = game.settings.get(MODULE_ID, SETTINGS.MAX_LINES.key) as number;

        const signature = [
            name,
            localMaxWidth,
            minFontSize,
            shrinkStep,
            maxLines,
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
            !force &&
            cached !== undefined &&
            cached.signature === signature &&
            style.fontSize === cached.fontSize &&
            nameplate.text === cached.text &&
            style.wordWrap === cached.wordWrap;

        if (stillInEffect) return;

        const result = this._fit(nameplate, name, localMaxWidth, minFontSize, shrinkStep, maxLines);
        nameplate.hitArea = result.ellipsisRect ?? new PIXI.Rectangle(0, 0, 0, 0);
        this._bindHoverReveal(token, nameplate);

        appliedFits.set(token, {
            signature,
            fontSize: style.fontSize as number,
            text: nameplate.text,
            wordWrap: style.wordWrap as boolean,
            fullName: name,
            truncated: result.truncated
        });
    }

    private static _bindHoverReveal(token: Token, nameplate: PIXI.Text): void {
        if (hoverBoundNameplates.has(nameplate)) return;
        hoverBoundNameplates.add(nameplate);

        // Tokens have their own hitArea covering just their icon, and PIXI's
        // normal hit-test walk prunes recursion into a container's children
        // once the container's own hitArea rejects the point — so pointerover/
        // pointerout, which rely on that walk, never reach a nameplate sitting
        // outside the token's icon bounds. globalpointermove is dispatched to
        // every interactive display object on every pointer move regardless of
        // that pruning, so we do our own enter/leave tracking against it here.
        nameplate.eventMode = "static";
        nameplate.on("globalpointermove", (event: PIXI.FederatedPointerEvent) => {
            const cached = appliedFits.get(token);
            const local = nameplate.toLocal(event.global);
            const isOver = !!cached?.truncated && (nameplate.hitArea as PIXI.Rectangle).contains(local.x, local.y);
            const wasOver = hoveringTokens.has(token);

            if (isOver && !wasOver) {
                hoveringTokens.add(token);
                nameplate.text = cached!.fullName;
            } else if (!isOver && wasOver) {
                hoveringTokens.delete(token);
                if (cached) nameplate.text = cached.text;
            }
        });
    }

    static refreshAll(): void {
        if (!canvas?.ready) return;
        for (const token of canvas.tokens?.placeables ?? []) {
            this.apply(token, true);
        }
    }

    private static _fit(
        nameplate: PIXI.Text,
        name: string,
        maxWidth: number,
        minFontSize: number,
        shrinkStep: number,
        maxLines: number
    ): FitResult {
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
            return { truncated: false, ellipsisRect: null };
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

            if (metrics.lines.length <= maxLines) {
                this._commit(nameplate, name, fontSize, {
                    wordWrap: true,
                    wordWrapWidth: maxWidth,
                    breakWords: trial.breakWords
                });
                return { truncated: false, ellipsisRect: null };
            }

            const lines = metrics.lines.slice(0, maxLines);
            const lastIndex = lines.length - 1;
            lines[lastIndex] = this._truncateToFit(lines[lastIndex] ?? "", maxWidth, trial);
            this._commit(nameplate, lines.join("\n"), fontSize, { wordWrap: false });

            const bounds = nameplate.getLocalBounds();
            const ellipsisWidth = measureText(ELLIPSIS, trial).width;
            const lastLineWidth = measureText(lines[lastIndex], trial).width;
            const lineX = this._alignedLineX(trial.align, bounds.x, bounds.width, lastLineWidth);
            const lastLineY = bounds.y + bounds.height - metrics.lineHeight;

            return {
                truncated: true,
                ellipsisRect: new PIXI.Rectangle(
                    lineX + lastLineWidth - ellipsisWidth,
                    lastLineY,
                    ellipsisWidth,
                    metrics.lineHeight
                )
            };
        }

        const truncated = this._truncateToFit(name, maxWidth, trial);
        this._commit(nameplate, truncated, fontSize, { wordWrap: false });

        const bounds = nameplate.getLocalBounds();
        const ellipsisWidth = measureText(ELLIPSIS, trial).width;

        return {
            truncated: true,
            ellipsisRect: new PIXI.Rectangle(
                bounds.x + bounds.width - ellipsisWidth,
                bounds.y,
                ellipsisWidth,
                bounds.height
            )
        };
    }

    private static _alignedLineX(align: string, blockX: number, blockWidth: number, lineWidth: number): number {
        switch (align) {
            case "right":
                return blockX + (blockWidth - lineWidth);
            case "center":
                return blockX + (blockWidth - lineWidth) / 2;
            default:
                return blockX;
        }
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

const tooltipIconSprites = new WeakMap<Token, PIXI.Sprite>();

export class TooltipIconReplacer {
    static patchTokenPrototype(): void {
        const TokenClass = foundry.canvas.placeables.Token;
        const proto = TokenClass.prototype as unknown as { _refreshTooltip: (...args: unknown[]) => unknown };
        const original = proto._refreshTooltip;

        proto._refreshTooltip = function (this: Token, ...args: unknown[]): unknown {
            const result = original.apply(this, args);
            TooltipIconReplacer.apply(this);
            return result;
        };
    }

    static apply(token: Token): void {
        try {
            this._apply(token);
        } catch (error) {
            console.warn("token-names | Failed to replace elevation icon for token", token, error);
        }
    }

    private static _apply(token: Token): void {
        const tooltip = token.tooltip;
        const sprite = tooltipIconSprites.get(token);

        const enabled = game.settings.get(MODULE_ID, SETTINGS.REPLACE_ELEVATION_ICON.key) as boolean;
        if (!enabled || !tooltip || !tooltip.text.startsWith("+")) {
            if (sprite) sprite.visible = false;
            return;
        }

        const flyId = CONFIG.specialStatusEffects.FLY;
        const iconPath = CONFIG.statusEffects.find((effect) => effect.id === flyId)?.img;

        if (!iconPath) {
            if (sprite) sprite.visible = false;
            return;
        }

        tooltip.text = tooltip.text.slice(1);

        // PIXI's bounds calculation includes visible children, so a
        // previously-sized (or default-texture-sized) icon already parented
        // to the tooltip would contaminate this measurement of the text
        // itself. Hiding it first excludes it (PIXI skips invisible children
        // when computing bounds) so we always measure the text alone.
        if (sprite) sprite.visible = false;

        const bounds = tooltip.getLocalBounds();
        const size = bounds.height || ((tooltip.style as PIXI.TextStyle).fontSize as number);

        const icon = sprite ?? new PIXI.Sprite();
        if (!sprite) {
            tooltipIconSprites.set(token, icon);
            tooltip.addChild(icon);
        }

        const cachedTexture = foundry.canvas.getTexture(iconPath);
        icon.texture = cachedTexture instanceof PIXI.Texture ? cachedTexture : PIXI.Texture.from(iconPath);
        icon.width = size;
        icon.height = size;
        icon.x = bounds.x - size;
        icon.y = bounds.y + (bounds.height - size) / 2;
        icon.visible = true;
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
