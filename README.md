# resume-site

Michael Morse's resume. The published page is a project site at `https://mmorsecode.github.io/resume-site/`.

## Build the site

You need Node 22. The version is in `.nvmrc`.

Install dependencies with `npm ci`.

Build the site with `npm run build`. Vite writes `dist/` with the base path `/resume-site/`. Asset URLs in that build are relative, so they resolve under the project path.

Check the site with `npm run check`. The command formats nothing. It builds `dist/`, then checks format, HTML, links, privacy, and tests.

## Deploy

A push to `main` runs CI. After CI passes, the `pages` workflow builds `dist/` in an unprivileged job and deploys that directory. A pull request does not deploy.

The Pages source is GitHub Actions. The deploy job is not a required status check.

## Privacy

Do not commit Mike's phone number, home address, or other personal contact details. Do not invent contact details for the site. The public page shows Framingham, MA and the GitHub profile. It has no email address and no phone number.

`npm run privacy` fails if a tracked file contains a phone number or a street address.

## Agents

Agents working in this repo follow [AGENTS.md](AGENTS.md).
