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
