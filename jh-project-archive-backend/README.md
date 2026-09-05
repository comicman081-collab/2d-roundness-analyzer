# JH PROJECT ARCHIVE — zero-cost backend

Target free URL: `https://jh-project-archive.<workers-subdomain>.workers.dev`

## Cost rule

- Cloudflare Workers **Free** plan only.
- Do not enable Workers Paid.
- No paid domain.
- No D1/R2 is required for the initial friend-only access model.
- If the Workers Free request limit is exceeded, access should fail rather than upgrade to a paid plan.

## Secrets

Set these as Cloudflare Worker secrets, never commit their values:

- `SESSION_SECRET` — long random signing secret.
- `ADMIN_ID`
- `ADMIN_PASSWORD_SHA256`
- `FRIEND_ID`
- `FRIEND_PASSWORD_SHA256`
- `FULL_ACCESS_CODE_SHA256`

Generate password hashes locally with SHA-256. The public repository stores hashes only as Worker secrets; the passwords/access code are not placed in HTML or GitHub source.

## Route model

- `/` and public static assets: public portfolio UI.
- `/api/login`, `/api/unlock`, `/api/session`: authentication.
- `/preview/<project>/...`: signed 30-second preview route.
- `/full/<project>/...`: Full Access cookie required.

The Worker uses Static Assets with `run_worker_first` only for `/api/*`, `/preview/*`, and `/full/*`, so ordinary static assets remain on the free static-asset path.
