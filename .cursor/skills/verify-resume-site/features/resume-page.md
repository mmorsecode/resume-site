# Read the resume

A visitor on a desktop window sees Michael Morse's Signal resume, the location line, the section headings, the headshot, and the dark page styles.

## Sub-features

- `read-heading` shows `Michael Morse` as the page heading and the document title.
- `read-location` shows `Framingham, MA`.
- `read-sections` shows Summary, Experience, Military, Education, Skills, and Certifications.
- `read-styles` applies the dark background, light text, Inter, and a capped deck width.
- `read-portrait` shows the headshot from the project path.

## How to get to it (user POV)

- Open the URL printed by launch. It looks like `http://127.0.0.1:<port>/resume-site/`.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.

- **Open the page.** Visit the recorded URL at a desktop width. Run `node .cursor/skills/verify-resume-site/ctl.mjs drive resume-page`. The command exits 0.
- **Read the heading.** `verify-evidence/resume-page/result.json` has `observed.h1` and `observed.title` equal to `Michael Morse`, and `observed.innerWidth` equal to `1280`.
- **Read the location and sections.** `observed.location` is `Framingham, MA`. `observed.signalMark` is true. `observed.sections` contains `Summary`, `Experience`, `Military`, `Education`, `Skills`, and `Certifications`.
- **Read the layout.** `observed.h1FontSize` is `64px`. `observed.gridTracks` is `2`. `observed.deckMoreDisplay` is not `none`.
- **Confirm the paint.** `observed.color` is `rgb(231, 238, 246)`. `observed.background` is `rgb(12, 18, 28)`. `observed.fontFamily` contains `Inter`. `observed.maxWidth` is not `none`. `stylesheetStatus` is `200` and `observed.stylesheetHref` is `styles.css`.
- **Confirm the headshot.** `observed.headshot.naturalWidth` is greater than `0` and `observed.headshot.src` ends with `/resume-site/headshot.jpg`.
- **Proof.** `verify-evidence/resume-page/page.png` shows that heading and location on a dark page. `navigationStatus` is `200`.

## Gotchas

- A file:// open of `index.html` is a different entry point. This feature is the HTTP URL from `instance.json`.
- The location line is a city and state. It is not a street address.
- The deck `max-width` computes to a pixel width. Assert that `maxWidth` is not `none`. Do not assert a pixel value.
- The public GitHub Pages URL is not a substitute when this drive fails.
