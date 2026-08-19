##### 1.3.3

- Fix: the elevation icon (and the scale/position settings) only ever applied while actively dragging a token, because core's `_refreshTooltip` — the method this module hooks — only actually runs during a drag; hovering a stationary token merely toggles the tooltip's visibility without recomputing its content, so nothing this module does ever ran outside of a drag. The module now also forces a refresh whenever a token is hovered or selected, so the icon/scale/position apply in the normal case, not just while dragging.
- Fix: a token whose last refresh happened before the elevation icon's texture had finished loading was left with the icon hidden and no reason to refresh again on its own. The icon now automatically re-applies to all tokens the moment the texture finishes loading, rather than waiting for the next hover/drag.

##### 1.3.2

- Fix: the crash still recurred after 1.3.1's `texture.valid` check, because the icon's texture was being re-resolved via `PIXI.Texture.from()`/`getTexture()` on every single refresh instead of reused, which appears to have kept producing a texture whose `.valid` never settled permanently true. The icon's texture is now loaded exactly once (asynchronously) and the same confirmed-loaded `PIXI.Texture` instance is reused for every token from then on.

##### 1.3.1

- Fix: a second crash (`Cannot read properties of null (reading 'width')` in `Sprite.calculateVertices`/`_calculateBounds`), this time thrown from PIXI's own per-frame render pass rather than pointer events — meaning it could recur every tick for as long as the icon's texture wasn't ready to render, plausibly explaining the icon failing to show at all outside of dragging and tooltip scale/position changes appearing to have no effect while dragging (repeated uncaught exceptions could prevent new frames from completing). `Sprite`'s width/height setters and bounds calculation all read the texture's internal geometry with no readiness check, and a texture can be not-yet-loaded or since evicted by Foundry/PIXI's own resource management. The icon now checks `texture.valid` and re-resolves the texture on every refresh, staying hidden until it's actually ready to render instead of touching it prematurely.

##### 1.3.0

- Fix: a crash (`Cannot read properties of null (reading 'width')` in `Sprite.containsPoint`) could occur during ordinary pointer movement once the elevation icon was showing. The icon sprite inherits the interactive Token's effective event mode by default, so PIXI's pointer hit-testing tried to hit-test it and called into its texture before the texture had finished loading. The icon is now explicitly excluded from hit-testing (`eventMode = "none"`), since it was never meant to receive pointer events anyway — this likely also explains why the icon could get stuck hidden after dragging a token, since the uncaught crash could interrupt Foundry's own tooltip re-display logic mid-refresh.
- Added: an "Elevation Tooltip Scale" setting to resize the entire elevation tooltip (number and icon together).
- Added: an "Elevation Tooltip Position" setting with anchor presets (Top/Bottom Left/Center/Right, Center) plus X/Y pixel offset settings to fine-tune placement relative to the token. Defaults to Foundry's own placement until a preset is chosen. Applies regardless of whether "Replace Elevation Icon" is enabled.
- Fix: the elevation icon now sits 5px closer to the number.

##### 1.2.1

- Fix: the elevation icon never actually appeared. The icon sprite is parented to the tooltip text object so it inherits its transform, but PIXI's bounds calculation includes visible children — so once the icon existed as a child, it contaminated the very text-bounds measurement used to size and position it, on every refresh after the first. The icon is now hidden before that measurement (PIXI skips invisible children when computing bounds) so it always measures the text alone.

##### 1.2.0

- Added: a "Replace Elevation Icon" setting (default off). When enabled, a token's elevation tooltip has its "+" replaced with the world's configured Flying status effect icon, keeping the elevation number visible. Negative elevation, zero elevation, and worlds without a Flying status effect configured are left untouched.

##### 1.1.1

- Fix: hovering over a truncated nameplate's "…" didn't reveal the full name. Tokens have their own `hitArea` covering just their icon, and PIXI's normal hit-test walk stops recursing into a container's children once the container's own `hitArea` rejects the pointer position — so `pointerover`/`pointerout` never reached a nameplate sitting outside the token's icon bounds. The hover reveal now uses PIXI's `globalpointermove` event, which is dispatched to every interactive object regardless of that pruning, with manual enter/leave tracking against the ellipsis region.

##### 1.1.0

- Added: a "Maximum Nameplate Lines" setting (default 3) capping how many lines a wrapped nameplate may span. If a name would need more lines than that at the minimum font size, the last visible line is truncated with an ellipsis instead of letting the nameplate grow indefinitely.
- Added: hovering directly over an ellipsis-truncated nameplate's "…" temporarily reveals the full, untruncated name; moving the pointer away restores the truncated display. Applies to both single-line and multi-line truncation.

##### 1.0.3

- Fix: on scenes using a non-default grid size, nameplates could badly overflow their token even though the module thought they fit. Foundry scales the nameplate text object relative to the scene's grid size, but the fit math compared the (unscaled) measured text width directly against the token's (scaled) pixel width. The comparison now converts the token width into the nameplate's local, unscaled space first.
- Fix: disposition-based nameplate coloring only ever applied once and then got silently reverted by core's next nameplate refresh, because the color application was skipped whenever the fit cache thought nothing had changed. Color is now reapplied on every refresh regardless of the fit cache.
- Fix: `Token.prototype` access triggered a v13+ deprecation warning (global `Token` is now namespaced under `foundry.canvas.placeables.Token`). The prototype patch now reads the class through the namespaced path.

##### 1.0.2

- Fix (for real this time): nameplates could still revert to their oversized default on scene switches, because the fix relied on `renderFlags.set()`, which only schedules a refresh for a later render tick and could race against core's own refresh cycle. The fit now runs by directly wrapping `Token#_refreshNameplate`, so it's applied synchronously every time core actually rebuilds a nameplate, with no timing dependency.
- Removed the now-unnecessary `canvasReady` and `refreshToken` hooks, superseded by the above.

##### 1.0.1

- Fix: nameplates could revert to their oversized default after a scene's initial load (or on switching scenes), because a stale cache skipped reapplying the fit after core reset the nameplate's style. The fit now detects when core has reset the nameplate and reapplies, and a `canvasReady` pass forces a fit once each scene finishes loading.
- Fit failures are now logged to the console instead of being silently swallowed.

##### 1.0.0

- Initial release.
- Auto-fit nameplate text to token width: shrink, then wrap or truncate.
- Per-token opt-out via Token Configuration.
- Optional disposition-based nameplate coloring.
