# Check contact privacy

The visitor can read the resume and does not see a phone number, an email address, or a street address. Contact is a label, not a mail or telephone link. The repository privacy scan passes.

## Sub-features

- `contact-label` shows the word Contact on a span.
- `no-direct-contact` has no mailto link and no tel link.
- `no-visible-contact` shows no phone number, email address, or street address in the page text.
- `privacy-scan` exits 0 from `npm run privacy`.

## How to get to it (user POV)

- Open the URL printed by launch.
- Read the header. The GitHub profile is a link. Contact is text beside it.
- Read the rest of the page for a phone number, an email address, or a street address.

## Driving it with ctl.mjs

Preconditions:

- Doctor printed `doctor ok` for this run's instance.

- **Open the page.** Run `node .cursor/skills/verify-resume-site/ctl.mjs drive contact-privacy`. The command exits 0.
- **Read the contact label.** `verify-evidence/contact-privacy/result.json` has `observed.contact.tag` equal to `SPAN` and `observed.contact.text` equal to `Contact`.
- **Confirm there is no direct contact link.** `privacy.mailto` is false and `privacy.tel` is false.
- **Confirm the visible page.** `privacy.findings` is empty.
- **Confirm the scan.** `privacy.status` is `0`.
- **Proof.** `verify-evidence/contact-privacy/page.png` shows the resume, including the Contact label. `navigationStatus` is `200`. `observed.h1` is `Michael Morse`.

## Gotchas

- `Framingham, MA` is the location line. It is not a street address, and this feature still requires it to be visible.
- A heading check does not prove the privacy scan ran. Require `privacy.status` `0`.
- The scan reads tracked files. A phone number or street address in the skill or the workflow fails this drive even when the page looks clean.
- Do not add a sample phone number, email address, or street address to make the scan demonstrate a failure.
