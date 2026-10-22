# Floating Google sign-in — design

Date: 2026-10-22
Status: approved, implementation pending

## Goal

Keep the homepage Google sign-in as a persistent floating control at the top-right,
instead of burying it in the hero CTA stack.

## Baseline (measured, dev server, 2026-10-22)

| Viewport | Header | Top-right occupants | Google wrapper before |
|---|---|---|---|
| 1440×900 | absolute, h 112, z-30 | nav + `Get certificate` + `Authenticate Your Item` (x 1061→1408) | (56, 662) 300×44, in hero flow |
| 768×1024 | absolute, h 100 | menu toggle (x 700→744) | (40, 549) 300×44 |
| 360×800 | absolute, h 100 | menu toggle (x 300→344) | (24, 634) 312×44 |

Hero content at 360: eyebrow y 144→160, title y 176→271, description y 291→340,
CTA y 566→622.

Known baseline defect, not caused by this change: GIS returns
`403 / GSI_LOGGER: The given origin is not allowed for the given client ID`
at `localhost:3000`, so the Google iframe renders 0×0. Do not treat this as a
regression.

## Decision

Fixed position, right gutter, below the header.

- Root wrapper `data-testid="google-signin-float"`, `position: fixed`, `z-20`
  (below header z-30 and mobile menu z-40).
- Mobile/tablet (<1024): compact icon-only button, `w-11` (44px), `right-4`
  (`sm:right-6`), top `calc(safe-area + 76px)` — 4px below the menu toggle
  (bottom 72), clear of the eyebrow at y 144.
- Desktop (≥1024): standard GIS pill, `w-[220px]`, `right-8` (`lg:right-8`),
  top `calc(safe-area + 128px)` — 16px below the 112px header.
- Signed-in users: keep visible (explicit decision, no auth-state branch).
- Scrolls away? No. Fixed for the whole page.
- DOM order: component is the first child of the hero `<section>`, so tab order
  follows header → Google → hero CTA, matching the visual position.

## Component contract (`app/google-sign-in-button.tsx`)

- Renders GIS `standard` / `size: large` / `text: signin_with` at desktop,
  `icon` / `size: large` below `lg`.
- Breakpoint is `matchMedia("(min-width: 1024px)")`. Re-render the GIS button on
  change; guard `accounts.id.initialize` with its own ref so it runs once, but
  allow repeated `renderButton` after `replaceChildren()`.
- Mobile icon is 40px from GIS inside a 44px wrapper; scale the GIS mount 1.1 so
  the hit area reaches 44px.
- Error / not-configured message renders as a readable chip
  (`rounded-full bg-mc-soft/95 px-3 py-2 text-mc-ink shadow-card`) because the
  control floats over both dark hero and cream sections.
- Missing `config.google.clientId` and script error behavior unchanged.

## Rejected options

- **Header cluster**: not floating, adds width pressure at 1024–1280.
- **Absolute over hero**: stops being visible after the hero.

## Files

- `app/google-sign-in-button.tsx` — positioning, responsive render mode, error chip.
- `app/page.tsx` — move `<GoogleSignInButton />` to the hero's first child.
- `app/components.tsx` — `SiteHeader` root gets `pointer-events-none`, inner row gets
  `pointer-events-auto`. The hero header is a transparent full-width box, so its
  empty area was swallowing clicks on the 24px of the floating control that sits
  inside the header band.
- `docs/google-sign-in-float.md` — this file.

No changes to `app/globals.css`, auth helpers, or API layer.

## Acceptance

1. Wrapper is `position: fixed`, desert-test id `google-signin-float`.
2. Geometry: 360 → x 300, y 76, 44×44; 768 → x 700, y 76, 44×44;
   1440 → x 1188, y 128, 220×44 (±2px).
3. At scrollY 0 no intersection with header content, hero eyebrow text range,
   title, description, or hero CTA at any of the three viewports. Text elements
   are compared by their text range rect, not their full-width block box.
4. The full 44×44 mobile/tablet control is hit-testable; `elementFromPoint` at
   the control's center and at its top edge returns the control, not the header.
5. At scrollY 400 the wrapper keeps the same viewport rect (fixed).
6. Keyboard reachable; wrapper or inner control has an accessible name.
7. No console errors beyond the two known GIS-origin errors from the baseline.
8. `npx tsc --noEmit`, `npm run lint` pass.
9. `git diff --name-only` contains only the three source files plus this doc.