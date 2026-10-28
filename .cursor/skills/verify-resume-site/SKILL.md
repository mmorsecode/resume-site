---
name: verify-resume-site
description: Drive the built Signal resume in headless Chrome at desktop and mobile widths. Use when proving the /resume-site/ page, that every link resolves under that path, or that no phone, email, or street address is visible. Do not use it to change GitHub Pages settings.
---

# Verify resume-site

The visitor sees one static page, the Signal resume. `npm run build` writes the Vite build to `dist/`. This skill copies that directory and serves it under `/resume-site/`. Drive that local build. The public URL `https://mmorsecode.github.io/resume-site/` is not the branch under test.

Run every command from the repository root. Node must be 22, the version in `.nvmrc`.

## Launch

```
node .cursor/skills/verify-resume-site/ctl.mjs launch
```

Launch runs `npm ci` and `npm run build`. It copies `dist/` into a temporary directory and serves that directory with `python3 -m http.server` on `127.0.0.1` at a free port. The page URL is `http://127.0.0.1:<port>/resume-site/`.

Ready means a GET of that URL returns 200 and the body contains `Michael Morse`, `Framingham, MA`, `Marketing Technology Specialist`, and `id="root"`.

Launch writes `verify-evidence/instance.json` with the pid, port, URL, and temporary directory. If that file names a live pid, launch exits 1 and does not start a second server. Two runs must not share one server.

## Doctor

```
node .cursor/skills/verify-resume-site/ctl.mjs doctor
```

Doctor is read-only. It exits 0 only when all of these are true.

- The pid in `verify-evidence/instance.json` is running.
- That pid's command is `python3` running `http.server` with the recorded port.
- `node` reports a version that starts with `v22`.
- GET of the recorded URL returns 200 and the body is the built Signal resume.
- `python3 --version` exits 0.
- Chrome exists at `CHROME_PATH`, or at `/usr/bin/google-chrome` when `CHROME_PATH` is unset.

Run doctor before the first drive. Run it again after a failed drive before the next attempt. If doctor fails because the server is gone, run cleanup, then launch again.

## Drive

Drive one feature at a time. Chrome must be the binary doctor checked. The helper talks to that Chrome with the DevTools protocol and starts it with `--no-sandbox`. The only resume page it opens is the local URL. It does not install a browser package.

```
node .cursor/skills/verify-resume-site/ctl.mjs drive resume-page
```

Replace `resume-page` with `mobile-layout`, `site-links`, or `contact-privacy`. The command opens the recorded URL in headless Chrome, checks the result named in that feature file, and writes both of these files.

- `verify-evidence/<feature>/page.png`
- `verify-evidence/<feature>/result.json`

`resume-page` uses a 1280 by 800 viewport. `mobile-layout` uses a 390 by 844 viewport. The other two features use the desktop viewport. A failed check exits 1 and still writes `result.json`.

## Evidence

`result.json` records the feature id, the local URL, the viewport, the navigation status, and the text and layout Chrome read. `page.png` is the full page at that viewport, taken after the load, not instead of the checks.

A passing desktop screenshot shows the heading `Michael Morse` and `Framingham, MA` on a dark page with light text. A passing mobile screenshot shows the same heading in a single column.

`site-links` also records every document URL and every stylesheet `url()`, with the status the browser already received or a follow-up GET when the browser did not request it. Same-origin URLs must sit under `/resume-site/`. The GitHub profile link is external and must still return a successful status.

`contact-privacy` records the `npm run privacy` exit code and whether the visible page contains a phone number, an email address, or a street address.

Proof is the local branch build. A fetch of `https://mmorsecode.github.io/resume-site/` does not pass or fail a drive. That page changes only after a merge to `main`.

## Cleanup

```
node .cursor/skills/verify-resume-site/ctl.mjs cleanup
```

Cleanup sends SIGTERM to the pid in `instance.json`, deletes that temporary directory, and deletes `instance.json`. It leaves `verify-evidence/<feature>/` in place.

Do not kill `python3` or `chrome` by name. Cleanup only signals the server pid this run started. Each drive already stops the Chrome process it started.

## Helpers

`ctl.mjs` is the helper. The commands in this file are the full interface. It uses Node 22, `python3`, and Chrome. It does not add a dependency to the site.

After the page changes, run `/maintain-verification-skill` so the feature map stays aligned with the built resume.
