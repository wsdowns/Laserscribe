# Laserscribe Color Palette

Dark theme with orange accent. All colors are defined as Tailwind v4 theme tokens in `frontend/src/index.css` using the `ls-` prefix.

---

## Core Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `ls-accent` | `#f97316` | Primary orange — logo ("scribed", "Scale"), buttons, links, dividers, badges, starburst |
| `ls-accent-dark` | `#ea580c` | Darker orange — gradients, hover states |
| `ls-accent-glow` | `rgba(249, 115, 22, 0.15)` | Orange glow — box shadows, ambient effects |

## Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `ls-dark` | `#0a0a0f` | Page background |
| `ls-darker` | `#06060a` | Deeper background (sidebar, footer) |
| `ls-surface` | `#12121a` | Cards, panels, elevated surfaces |
| `ls-surface-hover` | `#1a1a25` | Surface hover state |
| `ls-border` | `#2a2a3a` | Borders, dividers between surfaces |

## Text

| Token | Hex | Usage |
|-------|-----|-------|
| `ls-text` | `#e2e8f0` | Primary body text, strong tags |
| `ls-text-muted` | `#94a3b8` | Secondary text, descriptions, placeholders |
| — | `#ffffff` | Logo text ("Laser", "Power"), headings on dark backgrounds |
| — | `#6b7280` | Subtitles ("PRECISION ENGRAVING HUB", "CROWD-SOURCED LASER SETTINGS") |

## Status / Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `ls-green` | `#22c55e` | Success, positive votes |
| `ls-red` | `#ef4444` | Error, negative votes, destructive actions |
| `ls-blue` | `#3b82f6` | Info, links, secondary accent |
| `ls-gold` | `#fbbf24` | Gold standard badge, top-rated settings |

---

## Tailwind Usage

All tokens are available as Tailwind utility classes with the `ls-` prefix:

```
bg-ls-dark          text-ls-text
bg-ls-surface       text-ls-text-muted
bg-ls-accent        text-ls-accent
border-ls-border    text-ls-green
```

## Font

- **Primary**: `'Inter', system-ui, -apple-system, sans-serif`
