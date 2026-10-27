# Open the project path

GitHub Pages hosts this repository at `/resume-site/`. The stylesheet URL is relative, so the CSS request stays under that path.

## Sub-features

- `open-prefix` loads the page at `/resume-site/`.
- `css-under-prefix` requests `/resume-site/styles.css`.

## How to get to it (user POV)

- Open `http://127.0.0.1:<port>/resume-site/` using the port from launch.
- Do not open `http://127.0.0.1:<port>/`. That root is the parent directory of the temporary serve folder, not the project site.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.
- `instance.json` `url` ends in `/resume-site/`.

- **Open the prefixed URL.** Run `node .cursor/skills/verify-resume-site/ctl.mjs drive project-path`. The command exits 0.
- **Confirm the path.** `verify-evidence/project-path/result.json` has a `pageUrl` whose pathname is `/resume-site/` or `/resume-site/index.html`.
- **Confirm the asset path.** `observed.stylesheetAbsolute` ends with `/resume-site/styles.css`.
- **Confirm the heading.** `observed.h1` is `Michael Morse`.
- **Proof.** `verify-evidence/project-path/page.png` shows the resume. `navigationStatus` is 200.

## Gotchas

- A root server that maps `dist/` to `/` can pass the resume text and still hide a broken absolute URL. This feature fails unless the stylesheet URL contains `/resume-site/`.
- Launch is the only supported way to create that prefix. Do not point drive at a server you started by hand unless `instance.json` records that pid.
- If `https://mmorsecode.github.io/resume-site/` returns 404, Pages is off. That 404 does not replace the local `/resume-site/` check.
