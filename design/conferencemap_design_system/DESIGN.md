---
name: ConferenceMap Design System
colors:
  surface: '#0d1322'
  surface-dim: '#0d1322'
  surface-bright: '#33394a'
  surface-container-lowest: '#080e1d'
  surface-container-low: '#151b2b'
  surface-container: '#191f2f'
  surface-container-high: '#242a3a'
  surface-container-highest: '#2f3445'
  on-surface: '#dde2f8'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dde2f8'
  inverse-on-surface: '#2a3040'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0d1322'
  on-background: '#dde2f8'
  surface-variant: '#2f3445'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  container-max: 1440px
  sidebar-width: 280px
  gutter: 16px
---

## Brand & Style
The design system is engineered for high-performance developer environments, prioritizing information density, clarity, and rapid cognitive processing. The brand personality is technical, precise, and authoritative, designed to instill confidence in users managing complex event data and schedules.

The visual style is **Corporate Modern with a Developer-Centric edge**. It utilizes a "Dark Mode First" philosophy to reduce eye strain during prolonged sessions. Decoration is kept to a minimum, favoring structural integrity and functional color over ornamental flourishes. The aesthetic draws from modern IDEs (Integrated Development Environments), using color strictly for status, action, and category differentiation.

## Colors
The palette is built on a deep obsidian foundation to ensure high contrast for technical data.

- **Foundational Layers:** The background (`#0B1120`) serves as the canvas, while the surface (`#111827`) and elevated (`#1F2937`) levels provide structural depth.
- **Action & Status:** 
    - **Accent Blue:** Used for primary actions, navigation states, and focus indicators.
    - **Accent Green:** Indicates success, active sessions, or healthy system metrics.
    - **Accent Amber:** Reserved for warnings, pending states, or high-priority schedule conflicts.
- **Typography:** Pure white-smoke (`#F9FAFB`) ensures maximum legibility against dark backgrounds, while muted gray (`#9CA3AF`) handles secondary metadata.

## Typography
The typography system uses **Inter** for all UI elements to maintain a professional and highly readable interface. **Geist** is employed for monospaced data, labels, and citations to evoke a technical, terminal-like feel.

- **Headlines:** Use tight letter-spacing and bold weights to establish a clear information hierarchy.
- **Body:** Optimized for reading long-form speaker bios and technical abstracts.
- **Monospace (Geist):** Used specifically for timestamps, session IDs, and trust metrics (e.g., "99.9% Up-time").
- **Mobile Scaling:** For screens smaller than 768px, `headline-xl` should scale down to 32px and `headline-lg` to 24px.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for content areas, anchored by a fixed sidebar for navigation.

- **Grid Model:** 16px gutters and 24px side margins on desktop. On mobile, margins reduce to 16px and the grid collapses to a single column.
- **Spacing Rhythm:** Based on a 4px baseline. Components use `md (16px)` or `lg (24px)` padding to maintain a clean, airy feel despite the high data density.
- **Sidebar:** A fixed 280px left-hand navigation is standard for desktop, collapsing into a bottom-nav or hamburger menu on mobile.

## Elevation & Depth
Depth is created through **Tonal Layering** rather than traditional shadows. This maintains the clean, flat aesthetic preferred in developer tools.

- **Base Layer (Level 0):** Background color (`#0B1120`). Used for the main application canvas.
- **Surface Layer (Level 1):** Surface color (`#111827`). Used for cards, sidebar containers, and data grids.
- **Elevated Layer (Level 2):** Elevated color (`#1F2937`). Used for tooltips, modals, and dropdown menus.
- **Outlines:** To define boundaries without adding bulk, use a 1px solid border of `#1F2937` on all cards and containers. For active or focused states, transition the border color to the Accent Blue.

## Shapes
The design system adopts a **Soft (0.25rem)** shape language. This provides a subtle modern touch while maintaining the structural rigidity expected of a professional tool.

- **Standard Elements:** Buttons, input fields, and tags use 4px (0.25rem) corners.
- **Large Containers:** Cards and modals use 8px (0.5rem) to distinguish them from smaller UI widgets.
- **Interactive States:** Focus rings should follow the component's border radius with a 2px offset.

## Components
- **Buttons:** Primary buttons use a solid Accent-Blue background with white text. Secondary buttons use an outline style with no background.
- **Dark Cards & Trust Metrics:** Cards use the `Surface` color with a 1px `Elevated` border. Trust metrics (e.g., "Developer Verified") are displayed in a `label-sm` monospace font with a subtle Green or Blue dot.
- **Data Grids:** Use zebra-striping with a very subtle variation between Background and Surface colors. Headers are sticky and use the `label-md` Geist font.
- **Time-Blocking Agenda Cards:** These utilize left-border accents (4px wide) color-coded by session track (Blue for Tech, Green for Workshop, Amber for Keynote).
- **Analytics Tiles:** Minimalist charts with no background grid lines, using high-contrast stroke colors from the accent palette.
- **Sidebars:** Persistent, using the `Surface` color to distinguish from the main content `Background`. Icons are 20px and monochromatic unless active.
- **Input Fields:** Background should match the `Elevated` color to provide contrast against the `Surface` cards.