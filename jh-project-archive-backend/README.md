# JH PROJECT ARCHIVE — protected-build gateway (deferred)

The old custom ID/password Worker auth has been disabled.

## Current zero-cost member system

Membership now uses:

- **Firebase Authentication — Spark plan** for email/password signup, login persistence, email verification, and password reset.
- **Cloud Firestore — free quota** for username, nickname, age-14 confirmation, privacy-consent record, Full Access state, administrator state, and privacy requests.
- **GitHub Pages** for the public portfolio UI.

See `../jh-project-archive/auth/AUTH_SETUP.md` and `../jh-project-archive/auth/firestore.rules`.

## Why this folder remains

A Worker can later be used only as a protected-build gateway for non-public game assets. That phase is intentionally not enabled yet because current membership/authentication does not need a paid service or a Worker deployment.

## Cost rule

- Do not enable Workers Paid.
- Do not attach a paid domain.
- Do not store plaintext passwords or access codes in GitHub.
- If a future protected-build gateway is enabled, it must remain on a free/no-metered-billing design or fail closed when a free quota is reached.
