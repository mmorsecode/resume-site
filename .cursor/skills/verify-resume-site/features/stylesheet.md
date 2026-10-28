# Load the stylesheet

The page links `styles.css` with a relative URL. The text is light, the page is dark, the font is Inter, and the deck line length is capped.

## Sub-features

- `load-css` requests `styles.css` and receives status 200.
- `apply-color` sets the page color to `#e7eef6` and the background to `#0c121c`.
- `apply-measure` caps the deck width.

## How to get to it (user POV)

- Open the URL printed by launch.
- The browser follows the stylesheet link in the page head. The visitor does not click it.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.

- **Open the page.** Run `node .cursor/skills/verify-resume-site/ctl.mjs drive stylesheet`. The command exits 0.
- **Confirm the request.** `verify-evidence/stylesheet/result.json` has `observed.stylesheetHref` equal to `styles.css` and `stylesheetStatus` equal to 200.
- **Confirm the paint.** `observed.color` is `rgb(231, 238, 246)`. `observed.background` is `rgb(12, 18, 28)`. `observed.fontFamily` contains `Inter`. `observed.maxWidth` is not `none`.
- **Proof.** `verify-evidence/stylesheet/page.png` shows light text on a dark page. The JSON records the stylesheet URL the browser requested.

## Gotchas

- A 200 on `index.html` does not prove the stylesheet loaded. Require `stylesheetStatus` 200.
- The deck `max-width` computes to a pixel width that depends on the font. Assert that `maxWidth` is not `none`. Do not assert a pixel value.
- If Chrome is missing, the drive exits 1 before it writes a passing result. Set `CHROME_PATH` and launch again.
