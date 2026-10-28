# Follow the page links

Every link and asset the page names resolves. Same-origin URLs stay under `/resume-site/`. The GitHub profile is the one external link.

## Sub-features

- `open-prefix` loads the page at `/resume-site/`.
- `relative-assets` keeps stylesheet, headshot, favicon, and font URLs on that path.
- `profile-link` opens `https://github.com/mmorsecode` with a successful status.
- `no-root-absolute` rejects an href, src, or CSS `url()` that starts with `/` or `//`.

## How to get to it (user POV)

- Open `http://127.0.0.1:<port>/resume-site/` using the port from launch.
- Use the GitHub link in the page header.
- The browser follows the stylesheet, image, icon, and font URLs on its own. The visitor does not type those URLs.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.
- `instance.json` `url` ends in `/resume-site/`.

- **Open the prefixed URL.** Run `node .cursor/skills/verify-resume-site/ctl.mjs drive site-links`. The command exits 0.
- **Confirm the path.** `verify-evidence/site-links/result.json` has a page pathname of `/resume-site/` or `/resume-site/index.html`. `observed.stylesheetAbsolute` ends with `/resume-site/styles.css`.
- **Confirm every reference.** Each entry in `links` has a status from 200 through 299. A same-origin `url` starts with `/resume-site/` on that host. No `raw` value starts with `/` or `//`.
- **Confirm the required targets.** `links` includes `https://github.com/mmorsecode`, a URL ending in `/resume-site/styles.css`, a URL ending in `/resume-site/headshot.jpg`, and a URL ending in `/resume-site/favicon.ico`.
- **Proof.** `verify-evidence/site-links/page.png` shows the resume. `navigationStatus` is `200`.

## Gotchas

- A server that maps `dist/` onto `/` can show the resume text and still hide a broken absolute URL. This feature fails unless the stylesheet URL contains `/resume-site/`.
- The GitHub link is not under `/resume-site/`. It still has to resolve. Do not drop it to make the prefix check pass.
- Chrome may request `/favicon.ico` from the host root on its own. That extra request is not a page link. A parser or stylesheet request that leaves `/resume-site/` still fails the drive.
- Launch is the only supported way to create the prefix. Do not point drive at a server you started by hand unless `instance.json` records that pid.
