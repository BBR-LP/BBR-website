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

Next.js, pnpm workspaces. `apps/boat` is the first site on the shared page template; the others are
placeholder pages for now.

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

## The shared page template

`packages/ui/src/template` is the page every site uses: header, hero, booking section, seasons,
story, prices and hours, location, Good to know, sister-site cards, footer, plus the search markup
(title, description, business or race details). Styling is Tailwind; each app's `globals.css` has an
`@source` line so it scans the package.

- **`registry.ts`** is the one list of the four sites: name, live address, logo, brand tokens and
  search description. A site's description is also the text on its card on the other sites.
- **`brands/*.json`** are copies of `bre/{site}/assets/brand-tokens.json` (the source of truth).
- **Each app** supplies only its own content (`apps/boat/boat-content.ts`), its photos in `public/`,
  its fonts in `app/layout.tsx`, and `app/page.tsx`. Apps are hidden from search engines
  (`indexable: false`) until go-live; the old sites stay the public ones until a domain is moved.

