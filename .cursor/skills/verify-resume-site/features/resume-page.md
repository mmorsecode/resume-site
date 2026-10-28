# Read the resume

The visitor sees a page titled Michael Morse, a heading with that name, and Framingham, MA as the first line.

## Sub-features

- `read-heading` shows `Michael Morse` as the page heading.
- `read-location` shows `Framingham, MA`.

## How to get to it (user POV)

- Open the URL printed by launch. It looks like `http://127.0.0.1:<port>/resume-site/`.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.

- **Open the page.** Visit the recorded URL. Run `node .cursor/skills/verify-resume-site/ctl.mjs drive resume-page`. The command exits 0.
- **Read the heading.** `verify-evidence/resume-page/result.json` has `observed.h1` equal to `Michael Morse` and `observed.title` equal to `Michael Morse`.
- **Read the location.** The same file has `observed.paragraph` equal to `Framingham, MA`.
- **Proof.** `verify-evidence/resume-page/page.png` shows that heading and that location. `navigationStatus` is 200.

## Gotchas

- A file:// open of `index.html` is a different entry point. This feature is the HTTP URL from `instance.json`.
- If `https://mmorsecode.github.io/resume-site/` returns 404, Pages is off. Do not count that 404 as a failed heading. Browser steps use the local URL.
- The location is the first paragraph in `main`. Later paragraphs are the summary and the role text.
