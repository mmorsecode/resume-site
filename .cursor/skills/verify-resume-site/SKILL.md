---
name: verify-resume-site
description: Drive the resume-site placeholder in headless Chrome. Use when proving the static page, the stylesheet, or the /resume-site/ project path. Do not use it to change GitHub Pages settings.
---

# Verify resume-site

The visitor sees one static page. `npm run build` copies `site/` to `dist/`. This skill serves that copy under `/resume-site/` and reads it in Chrome.

Run every command from the repository root. Node must be 22, the version in `.nvmrc`.

## Launch

```
node .cursor/skills/verify-resume-site/ctl.mjs launch
```

Launch runs `npm ci` and `npm run build`. It copies `dist/` into a temporary directory and serves that directory on `127.0.0.1` at a free port. The page URL is `http://127.0.0.1:<port>/resume-site/`.

Ready means a GET of that URL returns 200 and the body contains `Mike Morse` and `This page is a placeholder. The resume is not published yet.`

Launch writes `verify-evidence/instance.json` with the pid, port, URL, and temporary directory. If that file names a live pid, launch exits 1 and does not start a second server.

## Doctor

```
node .cursor/skills/verify-resume-site/ctl.mjs doctor
```

Doctor is read-only. It exits 0 only when all of these are true.

- The pid in `verify-evidence/instance.json` is running.
- `node` reports a version that starts with `v22`.
- GET of the recorded URL returns 200.
- The body contains the placeholder sentence.
- `python3 --version` exits 0. Launch serves the site with `python3 -m http.server`.
- Chrome exists at `CHROME_PATH`, or at `/usr/bin/google-chrome` when `CHROME_PATH` is unset.

## Drive

Drive one feature. Chrome must be the binary doctor checked. The helper talks to that Chrome with the DevTools protocol and starts it with `--no-sandbox`. The only page it opens is the local URL. It does not install a browser package.

```
node .cursor/skills/verify-resume-site/ctl.mjs drive placeholder-page
```

Replace `placeholder-page` with `stylesheet` or `project-path`. The command opens the recorded URL in headless Chrome, checks the result named in that feature file, and writes both of these files.

- `verify-evidence/<feature>/page.png`
- `verify-evidence/<feature>/result.json`

The page has no buttons. Do not send clicks. A failed check exits 1 and still writes `result.json`.

## Evidence

`result.json` records the navigation status, the heading, the paragraph, the stylesheet URL, the stylesheet status, and the computed color, background, font, and max-width.

A passing screenshot shows the heading `Mike Morse` and the sentence `This page is a placeholder. The resume is not published yet.` on a white page with dark text.

`drive` opens the local URL in `instance.json`. Also fetch `https://mmorsecode.github.io/resume-site/` and `https://mmorsecode.github.io/resume-site/styles.css`. After Pages attempt 2 on 2026-10-27, both returned 200 and the bodies matched `site/index.html` and `site/styles.css`. If either URL returns 404, Pages is off. Report that, and still prove the local URL. Do not treat the 404 as a failed heading.

## Cleanup

```
node .cursor/skills/verify-resume-site/ctl.mjs cleanup
```

Cleanup sends SIGTERM to the pid in `instance.json`, deletes that temporary directory, and deletes `instance.json`. It leaves `verify-evidence/<feature>/` in place.

Do not kill `python3` by name. Cleanup only signals the pid it started.

## Helpers

`ctl.mjs` is the helper. The commands in this file are the full interface. It uses Node 22, `python3`, and Chrome. It does not add a dependency to the site.

After the page changes, run `/maintain-verification-skill` so the feature map stays aligned with `site/index.html`.
