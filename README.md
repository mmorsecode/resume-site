# resume-site

Michael Morse's personal resume website. The published page is a placeholder until the resume is ready.

## Build the site

You need Node 22. The version is in `.nvmrc`.

Install dependencies with `npm ci`.

Build the site with `npm run build`. The command copies `site/` to `dist/`.

Check the site with `npm run check`. The command checks format, HTML, links, privacy, and tests.

## Deploy

A push to `main` runs the `pages` workflow. The workflow builds `dist/` and deploys that directory to GitHub Pages. A pull request does not deploy.

The site is a project site. Keep asset URLs relative so they work at `https://mmorsecode.github.io/resume-site/`. The placeholder links `styles.css` that way.

Set the Pages source to GitHub Actions under Settings, then Pages, then Source.

## Privacy

Do not commit Mike's phone number, home address, or other personal contact details. Do not invent contact details for the site.

`npm run privacy` fails if a tracked file contains a phone number or a street address.

## Agents

Agents working in this repo follow [AGENTS.md](AGENTS.md).
