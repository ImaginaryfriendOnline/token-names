##### 1.0.1

- Fix: nameplates could revert to their oversized default after a scene's initial load (or on switching scenes), because a stale cache skipped reapplying the fit after core reset the nameplate's style. The fit now detects when core has reset the nameplate and reapplies, and a `canvasReady` pass forces a fit once each scene finishes loading.
- Fit failures are now logged to the console instead of being silently swallowed.

##### 1.0.0

- Initial release.
- Auto-fit nameplate text to token width: shrink, then wrap or truncate.
- Per-token opt-out via Token Configuration.
- Optional disposition-based nameplate coloring.
