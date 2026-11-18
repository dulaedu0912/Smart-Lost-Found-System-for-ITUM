---
name: Smart Campus Lost & Found
library: heroui-native
styles: heroui-native/styles
platforms:
  - ios
  - android
  - web
modes:
  - light
  - dark
source: "./global.css"
---

# Smart Campus design contract

This file is the visual contract for the app. It is adapted from the HeroUI Native
default theme (`https://heroui.com/native/DESIGN.md`) and overrides it where the
campus palette differs.

Read it before any visual change. If this file and `heroui-native` disagree, the
installed package wins; if this file and `global.css` disagree, `global.css` wins.

## Setup

Tokens live in `global.css`; the app never imports a JS palette.

```css
@import "tailwindcss";
@import "uniwind";
@import "heroui-native/styles";
```

- `metro.config.js` wires Uniwind (`withUniwindConfig`) and must keep
  `wrapWithReanimatedMetroConfig`.
- `src/app/_layout.tsx` imports `../../global.css`, wraps the tree in
  `GestureHandlerRootView` + `HeroUINativeProvider`, and drives the navigation
  theme from `useUniwind()` so headers and tabs follow the same tokens.
- `app.json` uses `userInterfaceStyle: "automatic"`; Uniwind follows the system
  setting, `Uniwind.setTheme()` forces one.

## Design direction

- Institutional campus utility in the University of Moratuwa colours: warm paper
  background, ink text, one deep maroon accent (the emblem's gear) reserved for
  action and emphasis, gold (the emblem's lion and wheat) only for caution.
- Hierarchy comes from spacing, type scale, and surface level — not borders,
  gradients, or extra color.
- Color carries meaning: LOST is caution, FOUND is resolution, danger is for
  destructive or failed actions only.
- Every screen must work at large accessibility font sizes and in both modes
  without branching on color scheme.

## Color

Use the semantic utility in the left column. Never write a hex, `oklch()`, or
`gray-*`/`zinc-*` class in product code. Raw values are here for design QA only;
they are already resolved for light and dark by Uniwind.

| Role | Utilities | Light | Dark |
| --- | --- | --- | --- |
| Canvas | `bg-background text-foreground` | `#f8f5f0` | `#140f0c` |
| Surface | `bg-surface text-surface-foreground` | `#fffefc` | `#1d1815` |
| Secondary surface | `bg-surface-secondary` | `#f4f1ea` | `#26201d` |
| Tertiary surface | `bg-surface-tertiary` | `#eeeae2` | `#2f2925` |
| Overlay | `bg-overlay` | `#fffefc` | `#221d19` |
| Backdrop | `bg-backdrop` | black 20% | black 40% |
| Muted text | `text-muted` | `#615953` | `#aaa39b` |
| Neutral action | `bg-default text-default-foreground` | `#f1ede5` | `#2b2521` |
| Accent | `bg-accent text-accent-foreground` | `#782b1d` | `#da6e5a` |
| Success (FOUND) | `bg-success` / `bg-success-soft` | `#6bb888` | `#7bc495` |
| Warning (LOST) | `bg-warning` / `bg-warning-soft` | `#eaaa36` | `#f5bd56` |
| Danger | `bg-danger` | `#cb2336` | `#ec5258` |
| Field | `bg-field text-field-foreground` | `#fffefc` | `#251f1c` |
| Border | `border-border` | `#e4e0d9` | white 10% |
| Separator | `border-separator` | `#dad6ce` | `#38312d` |

Derived tokens (`accent-hover`, `accent-soft`, `warning-soft-foreground`,
`border-secondary`, ...) are computed with `color-mix()`. Use them; do not rebuild
the formula by hand.

Semantic mapping for this product:

- `LOST` → `color="warning"` chips and `bg-warning-soft` leading glyph.
- `FOUND` → `color="success"` chips and `bg-success-soft` leading glyph.
- Claim errors, sign-out, destructive confirmations → `danger`.
- `ALERT`/`ACTIVE`/status chips → `default`; accent means "needs you", not "good".

## Typography

All text renders through `Typography` (the `Text` export is deprecated). Text
styles never inherit from a `View` or `Pressable`, so put `type`, `weight`,
`color`, and `align` on the text slot itself — `Typography`, `Button.Label`,
`Card.Title`, `ListGroup.ItemTitle`.

- Screen title: `type="h1" weight="bold"` inside `Hero`.
- Section heading: `type="h5"`.
- Item title: `type="h6"`, body copy: `type="body"` / `body-sm`.
- Metadata and chips: `body-xs`, `weight="semibold"`, `color="muted"`.
- Eyebrow: `body-xs weight="bold"` + `uppercase tracking-widest text-accent`.
- Numbers that change or align (percentages, counts) use tabular figures.
- Keep `allowFontScaling` on. Avoid more than two type sizes in one card block.

## Layout

- Phone-first. Default container is `px-4` with `gap-4`; page bottom padding
  `pb-12` so the last action clears the tab bar.
- Scrollable screens use `Page`; the browse feed uses `FlatList` with
  `contentInsetAdjustmentBehavior="automatic"` and `ItemSeparatorComponent`
  (`h-2`), never a `map` inside a `ScrollView` for lists.
- Respect safe-area insets on every edge screen and around floating controls.
- Keep primary actions reachable with one thumb; account for the keyboard on the
  report and login forms (`keyboardShouldPersistTaps="handled"`).
- Prefer flex and content-driven sizing over fixed widths; `<Image>` heights
  (`h-48`, `h-56`) are the only intentional fixed dimensions.
- Use `px-*`, `gap-*`, `pb-*`; no numeric `style={{ margin }}` spacing.

## Shapes

`--radius` is the HeroUI default `0.5rem`. Card-like shells are `rounded-3xl`
(24px), inner media `rounded-2xl`, chips and pills are fully rounded by their
component. `h-1`/`h-1.5` progress bars use `rounded-full`.

## Elevation

- `Card` and `Surface` already carry `shadow-surface`; do not add another shadow.
- Overlays (dialogs, menus, sheets) use `shadow-overlay`.
- Dark mode intentionally drops surface shadows and gives overlays an inset edge.
- Separate stacked cards with `gap-2`, not borders.

## Components

HeroUI Native is the primitive layer. Use it directly before writing anything new:
`Card`, `Surface`, `ListGroup`, `Separator`, `Avatar`, `Alert`, `Chip`,
`Typography`, `Spinner`, `PressableFeedback`, `TextField`/`Label`/`Input`/`Description`.

Thin app wrappers exist only to fix a product convention — keep their call sites:

| Component | Use it for | Convention |
| --- | --- | --- |
| `Page` | scrollable screen body | `bg-background`, `gap-4 px-4 pb-12 pt-2` |
| `Hero` | screen title block | eyebrow + `h1` + optional muted subtitle |
| `Button` | any action | `primary` one per screen, `secondary`, `danger`; haptic on press |
| `Chip` | filter row | selected → `accent`/`primary`, else `default`/`secondary` |
| `KindBadge` / `StatusBadge` | LOST/FOUND and report state | warning/success `soft`; `ACTIVE` renders nothing |
| `ListingCard` | browse row | `Card` + `PressableFeedback.Highlight`, 48px glyph, 2-line clamp |
| `MatchCard` | alert row | accent score, thin `bg-accent-soft` meter |
| `EmptyState` | no data / no match | short title, one sentence, no illustration |
| `TextField` | every form field | `Label` + `Input` + optional `Description`; multiline gets `min-h-28` |

- Pressable rows wrap content in `PressableFeedback` with a matching
  `PressableFeedback.Highlight className="rounded-3xl"`.
- Errors are inline `Alert status="danger"`; warnings `status="warning"`;
  context `status="accent"`. Do not block the screen with a modal for a
  recoverable form error.
- One primary action per screen; secondary actions are `secondary` or `ghost`.

## Interaction and accessibility

- Use `onPress`, never a web click handler.
- Keep roles, labels, `accessibilityState`, and disabled state. Filters set
  `accessibilityState={{ selected }}`; icon-only controls need `accessibilityLabel`.
- Touch targets stay at 44pt; compact controls get `hitSlop` instead of growing.
- Pair every status color with text (`LOST`, `FOUND`, `CLAIMED`, `RETURNED`).
- Keep `--opacity-disabled: 0.5`; never make a disabled control interactive.
- Verify both modes and large text before finishing a screen.

## Motion

- Use component `animation` props; do not override animated styles.
- Haptics: `selectionAsync` for chips and row presses, `notificationAsync(Success)`
  for a successful claim. Haptics are additive — never the only feedback.
- Honor Reduce Motion; use `animation="disable-all"` or the provider setting when
  motion must stop.

## Do

- Use semantic utilities: `bg-background`, `bg-surface`, `text-muted`,
  `border-separator`, `bg-accent-soft`.
- Use the same class in both modes and let Uniwind resolve the value.
- Compose HeroUI compound parts (`Card.Title`, `Button.Label`, `Alert.Content`).
- Add new tokens to `global.css` only when no existing token expresses the role.

## Don't

- Don't hardcode colors, shadows, or radii; don't write `light`/`dark` branches
  around styles.
- Don't use raw palette classes (`gray-*`, `slate-*`, `#hex`) in screens.
- Don't use `bg-warning` as a page or card background — use `-soft` or
  `surface-secondary`.
- Don't put text styles on a `View` and expect them to apply.
- Don't add a second shadow, a gradient, or a decorative illustration.
- Don't replace `onPress`, portals, or safe-area handling with web patterns.

## Source of truth

- Theme values: `mobile/global.css`
- Default tokens: `heroui-native/lib/module/styles/variables.css`
- Token → utility mapping: `heroui-native/lib/module/styles/theme.css`
- Component docs: https://heroui.com/docs/native/components
- Colors: https://heroui.com/docs/native/getting-started/colors
- Theming: https://heroui.com/docs/native/getting-started/theming
