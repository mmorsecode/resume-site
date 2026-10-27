# Resume site verification map

This directory is the source for verifying what a visitor can see. Read this index, then use the feature file as the recipe.

## Baseline preconditions

- Node 22 is on `PATH`. The version in `.nvmrc` is `22`.
- `python3 --version` exits 0.
- `CHROME_PATH` points at Chrome, or `/usr/bin/google-chrome` exists.
- `node .cursor/skills/verify-resume-site/ctl.mjs launch` has printed `ready` and written `verify-evidence/instance.json`.
- `node .cursor/skills/verify-resume-site/ctl.mjs doctor` has printed `doctor ok`.
- Drive only the instance this run started. A second launch exits 1 while that pid is alive.

## Driving conventions

- Start every recipe from the baseline above.
- The page has one heading, one paragraph, and one stylesheet link. There are no buttons.
- Treat every `ctl.mjs` command as literal.
- Run the browser through `node .cursor/skills/verify-resume-site/ctl.mjs drive <feature>`.
- Leave `verify-evidence/<feature>/` in place during cleanup.

## Proof and skip reporting

- Capture the navigation and the text Chrome read, not only the final screenshot.
- UI proof is `page.png` plus `result.json` for that feature.
- Record the feature id in `result.json`.
- If launch cannot become ready, report the command and the unmet precondition. Do not mark another URL as a substitute.
- Fetch `https://mmorsecode.github.io/resume-site/` for the published page. After Pages attempt 2 on 2026-10-27 it returned 200 and matched `site/index.html`. A 404 means Pages is off. The drive commands still use the local URL in `instance.json`.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then four H2 sections in this order.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with ctl.mjs`
4. `Gotchas`

## Features

- [Read the placeholder](./placeholder-page.md) covers the heading and the placeholder sentence at the local project URL.
- [Load the stylesheet](./stylesheet.md) covers the relative `styles.css` link and the computed color, background, font, and width.
- [Open the project path](./project-path.md) covers the same page at `/resume-site/` rather than at the host root.
