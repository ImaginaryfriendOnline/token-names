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
