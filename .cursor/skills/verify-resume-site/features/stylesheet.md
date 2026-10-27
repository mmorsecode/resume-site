# Load the stylesheet

The page links `styles.css` with a relative URL. When the file loads, the text is dark, the page is white, the font is system-ui, and the body width is capped.

## Sub-features

- `load-css` requests `styles.css` and receives status 200.
- `apply-color` sets the page color to `#222` and the background to `#fff`.
- `apply-measure` sets a body max-width, so the line length stays narrow.

## How to get to it (user POV)

- Open the URL printed by launch.
- The browser follows the stylesheet link in the page head. The visitor does not click it.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.

- **Open the page.** Run `node .cursor/skills/verify-resume-site/ctl.mjs drive stylesheet`. The command exits 0.
- **Confirm the request.** `verify-evidence/stylesheet/result.json` has `observed.stylesheetHref` equal to `styles.css` and `stylesheetStatus` equal to 200.
- **Confirm the paint.** `observed.color` is `rgb(34, 34, 34)`. `observed.background` is `rgb(255, 255, 255)`. `observed.fontFamily` contains `system-ui`. `observed.maxWidth` is not `none`.
- **Proof.** `verify-evidence/stylesheet/page.png` shows dark text on a white page. The JSON records the stylesheet URL the browser requested.

## Gotchas

- A 200 on `index.html` does not prove the stylesheet loaded. Require `stylesheetStatus` 200.
- `max-width: 65ch` computes to a pixel width that depends on the font. Assert that `maxWidth` is not `none`. Do not assert a pixel value.
- If Chrome is missing, the drive exits 1 before it writes a passing result. Set `CHROME_PATH` and launch again.
