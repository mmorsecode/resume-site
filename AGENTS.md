# Agents

Use this file when you change the resume site.

## Working standard

Use pstack and /poteto-mode for non-trivial work. Install pstack from the Cursor plugin at <https://github.com/cursor/plugins/tree/main/pstack>. Do not copy the plugin into this repository.

Match the task to a poteto-mode playbook and follow that playbook.

Run /setup-pstack to choose models. It writes `~/.cursor/rules/pstack-models.mdc`. pstack reads role labels from that file. If the file is missing, pstack uses its skill defaults. Do not invent role names.

## Commands

You need Node 22. The version is in `.nvmrc`.

Install dependencies with `npm ci`.

Run `npm run check` before you open a pull request. The command checks format, HTML, links, privacy, and tests. It does not write the site.

Run `npm run build` to copy `site/` to `dist/`.

## Privacy

Never commit Mike Morse's phone number, home address, or other personal contact details.

`npm run privacy` fails when a tracked file matches a phone number or a street address. Do not add a real number or a real address as an example, a fixture, or a comment. The tests build sample values in memory. Those samples are not Mike's details.

## Pull requests

Mike reviews and merges every pull request. Do not merge. Do not turn on auto-merge. Do not change branch protection or other repository settings.

You may set the GitHub Pages source to GitHub Actions. Leave every other setting alone.

The `pages` workflow deploys only from `main`. Do not make the `deploy` job a required status check. It does not run on pull requests, so a required `deploy` check would wait forever.

## Page content

`site/index.html` is a placeholder. Do not add resume content unless the task asks for the resume.

Keep asset URLs relative. The published site is a project site at `https://mmorsecode.github.io/resume-site/`.
