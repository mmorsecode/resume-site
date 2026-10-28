# Read the resume on a phone

A visitor on a narrow screen sees the same resume in one column, with a smaller heading and the long deck line hidden.

## Sub-features

- `mobile-width` lays the page out at a 390 pixel viewport.
- `mobile-stack` uses one grid column.
- `mobile-type` draws the heading at 36px.
- `mobile-deck` hides the deck continuation.

## How to get to it (user POV)

- Open the URL printed by launch on a phone-width window.
- Do not resize the desktop drive and call that this feature. This drive sets its own viewport.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.

- **Open the page.** Run `node .cursor/skills/verify-resume-site/ctl.mjs drive mobile-layout`. The command exits 0.
- **Confirm the width.** `verify-evidence/mobile-layout/result.json` has `viewport.width` equal to `390` and `observed.innerWidth` equal to `390`.
- **Read the heading.** `observed.h1` is `Michael Morse` and `observed.location` is `Framingham, MA`. `observed.signalMark` is true.
- **Confirm the stack.** `observed.gridTracks` is `1`. `observed.h1FontSize` is `36px`. `observed.deckMoreDisplay` is `none`.
- **Proof.** `verify-evidence/mobile-layout/page.png` shows the heading in a single column. `navigationStatus` is `200`. The pathname is `/resume-site/` or `/resume-site/index.html`.

## Gotchas

- The mobile rules apply at a viewport of 700px or narrower. A 1280px window does not prove this feature.
- Hiding the deck continuation does not remove the heading or the location line.
- The desktop screenshot cannot stand in for `mobile-layout/page.png`.
