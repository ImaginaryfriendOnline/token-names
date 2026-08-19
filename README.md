# 🏷️ Token Names

Keeps token nameplates from overflowing the width of their token. Names shrink to fit, wrap onto multiple lines when they still don't fit at the minimum size, or truncate with an ellipsis if they're a single word. Optionally colors nameplate text by token disposition.

## ✨ Features

- Automatically shrinks nameplate font size so text fits within the token's width.
- Wraps multi-word names onto multiple lines if they still don't fit at the minimum font size.
- Truncates single-word names with an ellipsis if they still don't fit at the minimum font size.
- Optional per-token override to disable auto-fit for an individual token.
- Optional mode to color nameplate text by the token's disposition (hostile/neutral/friendly/secret), using Foundry's own disposition color palette.

## ⚙️ Settings

- **Enable Nameplate Auto-Fit** — master on/off toggle for the width-fitting behavior (default: on).
- **Minimum Font Size** — the smallest size a nameplate will shrink to before wrapping or truncating instead.
- **Font Shrink Step** — how many pixels to reduce the font size by on each shrink attempt.
- **Color Nameplate by Disposition** — colors nameplate text using the token's disposition color (default: off).
- Per-token **Disable Nameplate Auto-Fit** checkbox, found in Token Configuration.

## 🛠️ Development

```bash
npm install
npm run build      # one-off build into dist/
npm run watch       # rebuild on save
npm run typecheck   # type-check without emitting
```

`dist/` is the deployable module — symlink or copy it into your local Foundry `Data/modules/token-names` directory to test.

## 📦 Installation

Install via manifest URL:

```
https://github.com/ImaginaryfriendOnline/token-names/releases/latest/download/module.json
```

## ✅ Compatibility

Foundry VTT v14. System-agnostic.

## 📚 Credits

Built by [Imaginaryfriend](https://github.com/ImaginaryfriendOnline).
