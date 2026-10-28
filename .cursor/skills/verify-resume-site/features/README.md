# Resume site verification map

This directory is the source for verifying what a visitor can see on the built Signal resume. Read this index, then use the feature file as the recipe.

## Baseline preconditions

- Node 22 is on `PATH`. The version in `.nvmrc` is `22`.
- `python3 --version` exits 0.
- `CHROME_PATH` points at Chrome, or `/usr/bin/google-chrome` exists.
- `node .cursor/skills/verify-resume-site/ctl.mjs launch` has printed `ready` and written `verify-evidence/instance.json`.
- `node .cursor/skills/verify-resume-site/ctl.mjs doctor` has printed `doctor ok`.
- Drive only the instance this run started. A second launch exits 1 while that pid is alive.

## Driving conventions

- Start every recipe from the baseline above.
- The page is the built resume served at `/resume-site/`. There are no buttons.
- Treat every `ctl.mjs` command as literal.
- Run the browser through `node .cursor/skills/verify-resume-site/ctl.mjs drive <feature>`.
- Leave `verify-evidence/<feature>/` in place during cleanup.

## Proof and skip reporting

- Capture the navigation and the text Chrome read, not only the final screenshot.
- UI proof is `page.png` plus `result.json` for that feature.
- Record the feature id in `result.json`.
- If launch cannot become ready, report the command and the unmet precondition. Do not mark another URL as a substitute.
- The public page at `https://mmorsecode.github.io/resume-site/` is not the branch build. Do not use it as a passing result.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then four H2 sections in this order.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with ctl.mjs`
4. `Gotchas`

## Features

- [Read the resume](./resume-page.md) covers the desktop page, its sections, and the applied stylesheet.
- [Read the resume on a phone](./mobile-layout.md) covers the same page at a mobile width.
- [Follow the page links](./site-links.md) covers every link and asset under `/resume-site/`.
- [Check contact privacy](./contact-privacy.md) covers a page with no phone number, email address, or street address, and a passing privacy scan.
