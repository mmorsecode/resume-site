# Read the placeholder

The visitor sees a page titled Mike Morse, a heading with that name, and one sentence that says the resume is not published yet.

## Sub-features

- `read-heading` shows `Mike Morse` as the only heading.
- `read-sentence` shows `This page is a placeholder. The resume is not published yet.`

## How to get to it (user POV)

- Open the URL printed by launch. It looks like `http://127.0.0.1:<port>/resume-site/`.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.

- **Open the page.** Visit the recorded URL. Run `node .cursor/skills/verify-resume-site/ctl.mjs drive placeholder-page`. The command exits 0.
- **Read the heading.** `verify-evidence/placeholder-page/result.json` has `observed.h1` equal to `Mike Morse` and `observed.title` equal to `Mike Morse`.
- **Read the sentence.** The same file has `observed.paragraph` equal to `This page is a placeholder. The resume is not published yet.`
- **Proof.** `verify-evidence/placeholder-page/page.png` shows that heading and that sentence. `navigationStatus` is 200.

## Gotchas

- A file:// open of `site/index.html` is a different entry point. This feature is the HTTP URL from `instance.json`.
- The published host `https://mmorsecode.github.io/resume-site/` is 404 until GitHub Pages is enabled. Do not count that 404 as a failed heading check. Report Pages as off and use the local URL.
- There is no second page. A missing heading fails this feature. Do not pass it from the stylesheet file alone.
