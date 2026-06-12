# Design System — ConferenceMap

A dark, developer-focused theme. Information-dense, low-decoration, built to make
verification *legible* — token counts, citations, and confidence are first-class
visual elements, not afterthoughts.

UX was designed with **Google Stitch** (4 screens). Reference exports live in
[`design/`](design/). The KendoReact default theme is overridden to dark in
[`src/app/globals.css`](src/app/globals.css).

## Color tokens

Defined as CSS custom properties on `:root`.

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0B1120` | App background (near-black navy) |
| `--bg-surface` | `#111827` | Cards, panels, message bubbles |
| `--bg-elevated` | `#1F2937` | Hover, active, headers |
| `--accent-blue` | `#3B82F6` | Primary CTA, links, citations, React Core track |
| `--accent-green` | `#10B981` | Savings, verified, HIGH confidence, JavaScript track |
| `--accent-amber` | `#F59E0B` | AI/ML track, warnings, MEDIUM confidence, declines |
| `--accent-red` | `#EF4444` | Errors, unverified claims, coverage gaps |
| `--text-primary` | `#F9FAFB` | Body text |
| `--text-secondary` | `#9CA3AF` | Secondary / supporting text |
| `--text-muted` | `#4B5563` | Labels, hints, disabled |
| `--border` | `#1F2937` | Standard dividers |
| `--border-subtle` | `#374151` | Card / input borders |

### Track colors

| Track | Color |
|---|---|
| React Core | `#3B82F6` blue |
| AI/ML | `#F59E0B` amber |
| JavaScript | `#10B981` green |
| Sponsored | `#8B5CF6` violet |
| Workshop | `#EC4899` pink |

## Typography

- **Family:** `Inter`, system-ui fallback.
- **Page title:** 24px / 700
- **Section / card header:** 14–16px / 600
- **Body:** 13–14px / 1.6 line-height
- **Labels & metrics captions:** 10–11px / 600, uppercase, `0.06–0.08em` tracking
- **Citations & token IDs:** monospace, 9–10px

## Spacing & shape

- Base unit: 4px. Common gaps: 8 / 12 / 16 / 24px.
- Radius: 4px (chips), 8px (cards/inputs), 10–12px (panels/bubbles), 18–20px (pills).
- Page padding: 24px vertical / 32px horizontal.
- Sidebar: fixed 220px.

## Component patterns

- **Trust panel (`TokenPanel`)** — the signature element. Input-token
  strikethrough → reduced count with an animated savings bar; output breakdown
  (answer / thinking); speed with ×-faster badge; confidence grade; cost; source
  chips. Green = good, amber = caution, red = risk.
- **Verified answer card** — green left-accent border + "Verified · cited &
  grounded" badge. Declines use the amber treatment.
- **Inline citations** — `[source: id]` rendered as superscript monospace chips
  so prose stays readable while remaining auditable.
- **Suggestion chips** — rounded pills for starters and follow-ups; hover reveals
  a sliding arrow and blue accent.
- **Status semantics** — confidence and track colors are consistent everywhere:
  a color always means the same thing.

## Accessibility notes

- All KendoReact surfaces (Grid, TileLayout/Card) are explicitly darkened at the
  cell level — the default theme paints light backgrounds, which would put light
  text on light surfaces. Overrides target `.k-table-*`, `.k-card-*`, and
  `.k-tilelayout-*` directly.
- Color is paired with text/icons (e.g. confidence shows the word HIGH, not just
  green) so meaning never depends on color alone.
