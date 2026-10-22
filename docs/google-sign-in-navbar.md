# Google sign-in in the navbar — design

Date: 2026-10-22
Status: implemented
Supersedes: the floating top-right variant (removed)

## Goal

Google sign-in lives in the site header as a tertiary action, styled to the
dark luxury theme, without competing with the gold primary CTA.

## Placement

`SiteHeader` renders the button once, as a direct child of the header row,
after the main nav and before the desktop CTA cluster. `hero` pages only
(homepage); other pages keep their existing header.

```
[brand]  [nav]            [Sign in with Google] [Get certificate] [Authenticate Your Item]
                          tertiary            secondary          primary (gold)
```

Mobile: compact icon-only control sits immediately left of the menu toggle,
same 44×44 box, same vertical centre. One mounted instance at every width.

## Theme fit

- GIS `theme: "filled_black"` matches the ink/brown header instead of the
  default white Google pill.
- GIS `shape: "pill"` matches the existing rounded-full header CTAs.
- A 1px `border-white/25` halo separates the dark button from the dark header.
- GIS renders the button; its inner styles are not themeable beyond the GIS
  options, so the wrapper carries the halo and sizing.

## Responsive modes

| Width | GIS config | Size |
|---|---|---|
| ≥1280px | `standard`, `text: signin_with`, width 200 | 202×44 |
| <1280px | `icon` | 44×44 |

GIS standard width cannot go below 200px, and at 1024px the navbar row
(164 brand + 280 nav + 200 button + 347 cluster + gaps) exceeds the 960px
content width. Icon-only below 1280 keeps the row inside the viewport; the
control keeps a 44×44 hit area and an accessible name.

## Behavior

- Re-renders the GIS button when the 1280px media query flips; `initialize`
  runs once, `renderButton` re-runs after clearing the mount.
- Signed-in users keep seeing the button (explicit decision).
- Script error and missing client ID show an inline chip below the control.
- `app/page.tsx` no longer renders the button; no hero CTA changes.
- `pointer-events` header changes from the floating variant are reverted.

## Files

- `app/google-sign-in-button.tsx` — navbar layout, dark GIS theme, responsive modes.
- `app/components.tsx` — render in `SiteHeader` for `hero` pages.
- `app/page.tsx` — drop the removed hero mount.
- `docs/google-sign-in-navbar.md` — this file.

## Acceptance

1. Homepage ≥1280: standard dark pill, 200px GIS, sits between nav and
   `Get certificate`, 16px gap each side, no overflow.
2. Homepage <1280: 44×44 icon control, 16px gap to the menu toggle, same
   vertical centre as the toggle.
3. No horizontal overflow at 360, 768, 1024, 1280, 1440.
4. Non-hero pages render no Google control; existing header unchanged.
5. Control keyboard reachable with an accessible name.
6. No console errors beyond the two known GIS-origin errors from localhost.
7. `npx tsc --noEmit`, `npm run lint` pass.