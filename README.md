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

Next.js, pnpm workspaces. `apps/boat` and `apps/bike` are on the shared page template; the others are
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
- **Shared editing settings** (`packages/ui/src/cms`): the notice, season, questions, phone and story
  settings are defined once and used by Boat and Bike; each app adds its own hours and prices or rates.
- **Boat's and Bike's editing screens** (`apps/boat`, `apps/bike`) group what the owners change: a notice across the top
  of the page, season, daily hours, prices, questions, phone number, and the story. Season, hours
  and prices are each said once; the hours box, the season question, the booking band and the
  search details follow from them. Title, main heading, search description, booking link, photos,
  address and email are locked in code. To try it without GitHub, run `next dev` with
  `NEXT_PUBLIC_KEYSTATIC_STORAGE=local` (edits write to the content folder; nothing is committed).
- **Name and logo in the editing screen:** each app's `ui.brand` is `keystaticBrand(slug)` from
  `@bbr/ui/cms`, which reads the site registry (name, and a small `mark`: Bike's badge, Boat's symbol
  on blue; a site without a mark gets its first letter on its brand color).
- **Staff login:** every template page's footer has a small "Staff login" link to `/keystatic`, so
  nobody needs a bookmark. It is `nofollow` and marked `data-untracked` (keep it out of click
  tracking), and each app has a `robots.ts` (`editorRobots` from `@bbr/ui`) that tells crawlers to
  skip `/keystatic` and `/api/keystatic`; the editing screen is also `noindex`.
- **Per app:** `keystatic.config.ts` (with `pathPrefix: "apps/<site>"`), `app/keystatic/*`,
  `app/api/keystatic/[...params]/route.ts`, and a `content/` folder.

## The photo review page (`apps/review`)

A private page for Kristen to choose photos (Use, Keep off, Not sure) with every choice logged. It is **not
public and not deployed**, and it serves nothing until one of two modes is configured:

- **`REVIEW_MODE=local`** with `REVIEW_DATA_DIR=<folder>` (made by `photo-tools review-prep`; never in git):
  no sign-in, for trying it on one machine.
- **`REVIEW_MODE=github`**: **sign in with GitHub** (the GitHub App "BBR-LP Photo Review"), and the page reads
  its batches and writes every choice to the **private repo `BBR-LP/BBR-photo-data`** with the signed-in
  person's own token, so each choice is a commit under their name. Settings in `.env.example`.

How sign-in works: the person goes to GitHub and comes back with a one-time code; the server swaps it for the
person's token, checks that the token can **write to the data repo** (a person who cannot is turned away), and
keeps it in an **encrypted, HttpOnly cookie** (8 hours; no database). Saves must come from the page's own
address. Choices queue in the server and retry if two people save at once. Until the business Dropbox is
connected (Clients #96), a hosted page shows a stand-in image instead of each photo.

Test without GitHub: `node apps/review/tools/mock-github.mjs --batch <sorted.json>` stands in for GitHub
(sign-in, a person without access, an expired sign-in, a save collision). Plan and the steps still to build
(Dropbox source, publish, the Vercel project): `bre/shared/photo-journal/001-workflow-plan.md`, Part 5.

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

