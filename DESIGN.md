---
name: IdleHold
description: A browser idle game where every skill is a trade that hangs its own painted sign.
colors:
  limestone: "#ecedea"
  limewash: "#f7f7f4"
  lifted-white: "#ffffff"
  rule: "#cfcfc8"
  ink: "#1b1712"
  muted: "#5b564c"
  oxblood: "#5a1e1b"
  oxblood-ink: "#f4f1ea"
  oxblood-soft: "#e9c9a6"
  ochre: "#c9932e"
  ochre-wash: "#f3e6c8"
  verdigris: "#2f6b58"
  danger: "#9b2c23"
typography:
  wordmark:
    fontFamily: "Grenze Gotisch, Alegreya Sans, serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
  display:
    fontFamily: "Grenze Gotisch, Alegreya Sans, serif"
    fontSize: "clamp(2.5rem, 4.5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1
  sign-level:
    fontFamily: "Grenze Gotisch, Alegreya Sans, serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1
  title:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
  count:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    fontFeature: "tnum"
  body-lg:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    fontFeature: "tnum"
  meta:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  button:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  section-label:
    fontFamily: "Alegreya Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.14em"
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "28px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.limewash}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "#33302a"
  button-primary-disabled:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.muted}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  header-band:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.oxblood-ink}"
    padding: "0 32px"
    height: "64px"
  trade-sign:
    backgroundColor: "{colors.verdigris}"
    textColor: "{colors.oxblood-ink}"
    rounded: "{rounded.md}"
    padding: "24px 36px 20px"
  trade-chip:
    backgroundColor: "{colors.verdigris}"
    textColor: "{colors.oxblood-ink}"
    rounded: "{rounded.sm}"
    size: "32px"
  rail-entry-selected:
    backgroundColor: "{colors.lifted-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  working-panel:
    backgroundColor: "{colors.lifted-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  action-card:
    backgroundColor: "{colors.limewash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  action-card-working:
    backgroundColor: "{colors.ochre-wash}"
    textColor: "{colors.ink}"
  cycle-bar:
    backgroundColor: "{colors.ochre-wash}"
    rounded: "{rounded.full}"
    height: "14px"
  away-notice:
    backgroundColor: "{colors.limewash}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
---

# Design System: IdleHold

## Overview

**Creative North Star: "Guild Signboards"**

Every skill is a trade, and every trade hangs its own painted sign from a wrought-iron bracket. The screen is a guild street seen in daylight: a pale limestone ground, an oxblood band across the top carrying the wordmark, and the active trade's board hung large in the main column. The world is medieval in its lettering and its one piece of ironwork, and plainly modern everywhere else: a clean sans with tabular figures, 1px rules, small radii, generous space.

It is a deliberate refusal of the genre's dark dashboard of identical panels and number walls. Density stays low; a player glancing at a background tab or a phone should read what is being worked, what accrued while they were away, and what to do next, in that order. Ornament is rationed to the bracket and the painted board. Colour carries meaning: each trade owns one paint, ochre means "working right now", and nothing else is decorated.

Motion is rare and earned. The working bar fills continuously; a confirmed reward briefly tints the stored count; a confirmed level-up makes the sign swing once from its bracket. Reduced motion holds everything still.

**Key Characteristics:**
- Limestone ground, oxblood header band, ink text.
- One paint per trade, used wherever that trade appears (sign, rail chip, action tiles).
- Gilded ochre reserved for the action being worked.
- Blackletter only for painted lettering: the wordmark and the sign.
- 1px rules, 4-6px radii, no glow, no gradients.
- A single signature motion: the damped sign swing on a confirmed level-up.

## Colors

A pale mineral ground with two heraldic anchors (oxblood and ink), one paint per trade, and a gilded accent that only marks live work.

### Primary
- **Guild Oxblood** (oxblood): the header band behind the wordmark and total level. It frames the whole screen and appears nowhere else as a fill; at 25% opacity it borders the "since you left" notice.
- **Board Cream** (oxblood-ink): lettering on any dark painted surface: the header band, the trade sign, the trade chips. Also the sign's level-progress fill and its painted inner lining (45% opacity).
- **Faded Gilt** (oxblood-soft): secondary text on the oxblood band ("Total level").

### Secondary
- **Woodcutting Verdigris** (verdigris): the Woodcutting trade's paint. It fills the sign board, the rail chip and the action icon tiles, and tints a stored count for 900ms when the server confirms a reward. Trades without a paint fall back to ink.

### Tertiary
- **Working Gilt** (ochre): the fill of the working action's cycle bar, the "working" dot in the trade rail, the border of the working action card, and text selection.
- **Gilt Wash** (ochre-wash): the cycle bar's track and the working action card's background.

### Neutral
- **Limestone** (limestone): the page ground.
- **Limewash** (limewash): side rails (trades, stores), resting action cards, the empty-state panel, the away notice. Also the primary button's label colour.
- **Lifted White** (lifted-white): the one or two surfaces that sit above the ground: the working panel, the selected rail entry, the lost-save notice.
- **Rule** (rule): every 1px divider and card border; the disabled button fill.
- **Iron Ink** (ink): text, the bracket, the primary button, the focus ring.
- **Weathered Ink** (muted): secondary text, section labels, meta lines.
- **Warning Red** (danger): server-rejection messages and, at 40% opacity, the lost-save notice border.

### Named Rules
**The One Paint Rule.** A trade owns exactly one paint, and that paint appears everywhere the trade does. Never introduce a second colour for a trade, and never use a trade's paint for anything that is not that trade.

**The Gilt Means Working Rule.** Ochre marks only what is being worked right now. If nothing is running, no ochre is on screen (text selection aside).

**The Lettering Contrast Rule.** Any paint that carries Board Cream lettering must reach 4.5:1 against it. This is why Woodcutting is #2f6b58 rather than a lighter green.

## Typography

**Display Font:** Grenze Gotisch (with Alegreya Sans, serif)
**Body Font:** Alegreya Sans (with ui-sans-serif, system-ui, sans-serif)

**Character:** A condensed blackletter used like a signwriter's brush, paired with a warm humanist sans that does all the reading. Figures are tabular across the whole document (`font-variant-numeric: tabular-nums` on the root), so counts and levels never jitter as they change.

### Hierarchy
- **Wordmark** (Grenze Gotisch 800, 34px, line-height 1): "IdleHold" in the header band. The capital I is set in Alegreya Sans 800, because Grenze's blackletter I reads as a J.
- **Display** (Grenze Gotisch 800, clamp(2.5rem, 4.5vw, 4rem), line-height 1): the trade name on its sign. One per screen.
- **Sign Level** (Grenze Gotisch 700, 1.875rem, 2.25rem from 640px, line-height 1): "Level N" on the sign; part of the painted lettering.
- **Headline** (Alegreya Sans 800, 1.875rem, line-height 1): the working action's verb ("Cutting pine"). Error and empty-state headings use 1.5-1.875rem at the same weight.
- **Title** (Alegreya Sans 800, 1.125rem, line-height 1.25): action names in the action list.
- **Count** (Alegreya Sans 800, 1.25rem, tabular): stored quantities.
- **Body Large** (Alegreya Sans 400, 1.125rem, line-height 1.375): the "since you left" sentence, with figures in 800.
- **Body** (Alegreya Sans 400-500, 16px): sign progress line, rail entries (700), store item names, working-action meta (500).
- **Meta** (Alegreya Sans 400-500, 15px): action detail lines, header total level, error messages, notices.
- **Button** (Alegreya Sans 700, 15px).
- **Section Label** (Alegreya Sans 800, 12px, 0.14em tracking, uppercase, Weathered Ink): the heading of each list region ("Trades", "Actions", "Stores"). It is the section's only heading, never a line stacked above another headline.

### Named Rules
**The Painted Lettering Rule.** Grenze Gotisch appears only where the world would paint letters: the wordmark and the trade sign. Everything a player reads as interface, including trade names in the rail at 16px, is Alegreya Sans.

**The Steady Figures Rule.** Numbers are always tabular. Emphasise a figure with weight (800), never with a different face or colour.

## Layout

A three-region street on wide screens: a trade rail on the left, the main column in the middle, stores on the right.

- **Below 1024px:** a single column. The trade rail becomes a horizontally scrolling row of trade tabs under the header (separated by a bottom rule, section label visually hidden); the main column follows; Stores moves below it with a top rule, its list in two columns from 640px.
- **1024px and up:** two columns, rail 240px plus the main column. The rail spans both rows with a right rule; Stores sits under the main column.
- **1280px and up:** three columns: rail 260px, main column, Stores 320px with a left rule. Stores becomes a single-column list.

The main column is capped at 880px and centred in its track, with 16px side padding (32px from 640px, 40px from 1024px) and 28px between its blocks: sign, notices, working panel, action list. The sign itself is capped at 768px. The header band is 64px tall with 16px (32px from 640px) side padding.

Spacing is a 4px-based rhythm: 8px and 12px inside lists and between tiles, 16px and 24px inside cards and panels, 28px between main-column blocks, 40px for desktop gutters. Action tiles sit in a two-column grid from 640px with 12px gaps.

## Elevation & Depth

The world is flat limestone with painted boards; depth is mostly tonal. The ground is Limestone, rails and resting cards are a half-step lighter (Limewash), and the few surfaces that matter most right now are Lifted White. Exactly one surface carries a shadow: the working panel, lifted softly off the ground because it is the thing the player is watching.

### Shadow Vocabulary
- **Working lift** (`box-shadow: 0 1px 2px rgb(27 23 18 / 0.06), 0 8px 24px -12px rgb(27 23 18 / 0.18)`): the working action panel only. A soft, ink-tinted ambient drop, never a hard offset.

### Named Rules
**The One Lifted Thing Rule.** Only the action being worked is lifted with a shadow. Everything else separates by tone and 1px rules.

**The No Glow Rule.** No glows, no gradients, no blurred backdrops. Gilt and paint read as flat colour.

## Shapes

Small, practical corners: 4px on buttons, chips, rail entries and the dismiss control; 6px on cards, panels, notices and the sign board. Progress bars are fully rounded capsules. Borders are always 1px: Rule on cards and dividers, ochre on the working card, ink at 30% on the selected rail entry, ink at 40% and dashed for the empty "nothing is being worked" panel.

The only non-rectangular form is the wrought-iron bracket: an SVG wall plate, a 4-unit arm across the sign's full width, a scrolled brace under the arm, and two ring hangers whose rods drop to the board's top corners. It is drawn in Iron Ink, stretches with the sign, and keeps its hanger strokes at a constant 2px.

## Components

### Buttons
Plain, sturdy, ink-on-stone.
- **Shape:** gently squared (4px), minimum height 40px, 16px horizontal padding, 15px bold label, optional 8px icon gap.
- **Primary:** Iron Ink fill with Limewash label. Hover darkens to the `ink-hover` token (#33302a), active goes to black. Disabled is a Rule fill with Weathered Ink text and the default cursor. Used for Start, Switch and Try again.
- **Quiet:** transparent with a 1px ink border at 70% and ink label. Hover adds a 5% ink tint, active 10%. Disabled shows a Rule border and muted text. Used for Stop.
- **Focus:** the global ring, 2px solid Iron Ink with 2px offset.
- **Transition:** colour only, 150ms.

### Trade Chips
A square of the trade's paint (32px in the rail, 40px on action tiles, 4px radius) holding the trade or action icon in Board Cream, outline icons at 1.75-2 stroke. They tie every mention of a trade back to its sign.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** Limewash at rest; Gilt Wash for the working action tile; Lifted White for the working panel.
- **Shadow Strategy:** flat, except the working panel (see Elevation & Depth).
- **Border:** 1px Rule; ochre on the working tile.
- **Internal Padding:** 16px on action tiles, 24px on the working panel, 16px by 20px on the away notice.

### Navigation
- **Trade Rail:** on wide screens a vertical list with a "Trades" section label; on phones a scrolling row of tabs. Each entry is 16px bold ink: paint chip, trade name, an 8px ochre dot when that trade is being worked, and the level right-aligned in tabular figures. The selected entry is Lifted White with a 1px ink-30% border and 4px radius; others have a transparent border so nothing shifts on selection.
- **Header Band:** 64px Guild Oxblood band with the wordmark on the left and "Total level N" on the right (Faded Gilt label, Board Cream figure in 800).

### The Trade Sign (signature)
The active trade's board, hung from the bracket. A 6px-radius panel in the trade's paint with 24px top, 20px bottom and 28px (36px from 640px) side padding. A signwriter's lining, a 1px Board Cream rule at 45% opacity, is inset 8px from the edge. Inside: the trade icon (40px, 48px from 640px), the trade name in Display, and "Level N" in Sign Level pushed right from 640px. Below, a 4px capsule track in black at 25% with a Board Cream fill showing progress to the next level (transform transition 500ms), and a 16px medium line that states the next level as a time estimate when working, an XP remainder when idle, or "Mastered".

**Swing:** when the server confirms a level-up, the board swings once from its top edge: `sign-swing`, 1100ms, `cubic-bezier(0.2, 0.7, 0.2, 1)`, a damped rotation of 2.4deg, -1.5deg, 0.7deg, -0.25deg, back to rest. It never swings on ordinary cycles, and it stays still under reduced motion.

### Working Panel
The action being worked right now, and the only lifted surface. Action icon (32px, ink) and verb in Headline; a 14px Gilt capsule bar on a Gilt Wash track that fills smoothly for the current cycle; then a muted 16px meta row (cycle time, yield, XP) with the Quiet Stop button pushed right. When nothing is worked, it is replaced by a dashed-border Limewash panel saying so and pointing to the actions below.

### Action Tiles
Every action of the selected trade, two per row from 640px. Paint chip, action name in Title, a 15px muted detail line (duration, yield, XP, separated by middle dots), and a primary Start or Switch button. The working action's tile turns Gilt Wash with an ochre border and replaces its button with the word "Working" in 15px 800.

### Stores
A list of stored items, largest first. Each row is a 1px top rule with the item name (16px) on the left and the count (Count style) on the right. When the server confirms a reward, the count tints Woodcutting Verdigris and fades back to ink over 700ms. The empty state is one muted sentence.

### Notices
- **Since you left:** a Limewash panel with a 1px oxblood-25% border and 6px radius, one Body Large sentence with figures in 800, and a 36px square dismiss control (muted X icon, 5% ink hover tint, 4px radius).
- **Lost save:** Lifted White with a 1px danger-40% border, 15px text, role status.
- **Server rejection:** a single 15px medium line in Warning Red, role alert.

## Do's and Don'ts

### Do:
- **Do** give every new trade exactly one paint that reaches 4.5:1 against Board Cream (#f4f1ea), and use it for its sign, rail chip and action tiles.
- **Do** keep ochre for the action being worked: its bar, its tile, its rail dot.
- **Do** hang each trade's sign from the iron bracket; the bracket and the painted board are the world's only ornament.
- **Do** set the trade name and "Level N" on the sign in Grenze Gotisch, and everything else in Alegreya Sans with tabular figures.
- **Do** separate surfaces with tone (Limestone, Limewash, Lifted White) and 1px Rule borders.
- **Do** tie motion to server-confirmed events only: the count tint on a confirmed reward, the sign swing on a confirmed level-up.
- **Do** honour reduced motion by holding the sign still and collapsing transitions.

### Don't:
- **Don't** build the genre's dark dashboard: no dark theme of identical panels, no walls of numbers.
- **Don't** set rail entries, buttons or any text under 1.875rem in Grenze Gotisch, and don't use its capital I in the wordmark.
- **Don't** add glows, gradients or hard offset shadows; the working panel's soft lift is the only shadow.
- **Don't** add ornament beyond the bracket and the sign's painted lining: no borders of knotwork, parchment textures or faux-aged effects.
- **Don't** swing the sign on every cycle or animate anything for a reward the server has not confirmed.
- **Don't** round corners beyond 6px on panels or 4px on controls, except capsule progress bars.
