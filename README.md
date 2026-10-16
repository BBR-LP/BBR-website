# BBR-website

The four Boat Bike Run sites in one repo, built from one shared template (decisions 007 and 009 in
`BBR-LP/BBR-engagement`).

```
apps/bike          bikelakeplacid.us
apps/run           lakeplacidmarathon.com
apps/boat          mlboatrental.com
apps/mothers-day   mothersdayrunlp.com   (live, Vercel project mothers-day)
packages/ui        shared components (the template)
```

Next.js, pnpm workspaces. Each site is a placeholder page for now.

## Local

```bash
pnpm install
pnpm dev:mothers-day   # or dev:bike, dev:run, dev:boat
pnpm build             # builds all four
```

## Vercel

One Vercel project per site, all in the **BikeBoatRun** team, all importing this repo. The only
per-project difference is **Root Directory**, set to that site's `apps/<name>` folder. Vercel
detects Next.js and pnpm on its own; leave build settings at their defaults.

## Public repo

This repo is public so that commits deploy without paid Vercel seats (decision 014 in
`BBR-engagement`). Never commit secrets: keys and passwords go in each Vercel project's
environment variables. Commit with a GitHub no-reply email address.

## Editing screen (Keystatic)

Each site gets an editing screen at `/keystatic`, in GitHub mode: saves are commits to this repo,
made by whoever signs in (they need write access). Proven on `apps/mothers-day` (2026-10-16).

- **GitHub App:** `BBR-LP Keystatic`, owned by the `BBR-LP` organization, installed on this repo
  only. One app serves all four sites; each live address is added as a redirect URI
  (`https://<domain>/api/keystatic/github/oauth/callback`) in the app's settings.
- **Four environment variables per Vercel project** (never in the repo; values in the shared
  Proton Pass item "BBR Keystatic GitHub App"): `KEYSTATIC_GITHUB_CLIENT_ID`,
  `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
  The same four go in a local, gitignored `.env` in the app folder for local work.
- **Per app:** `keystatic.config.ts` (with `pathPrefix: "apps/<site>"`), `app/keystatic/*`,
  `app/api/keystatic/[...params]/route.ts`, and a `content/` folder.

