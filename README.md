# Chanelle Adams Site

Astro static site powered by Sanity content.

## Is This a Monorepo?

No. This is a single Node/Astro project with one `package.json`.

It does have two deploy targets:

- Public website: built by Astro into `dist/` and deployed by Netlify.
- Sanity Studio: deployed to Sanity hosting and also embedded into the public site at `/studio/` during the Netlify build.

## Local Setup

```sh
npm ci
cp .env.example .env
```

Required environment variables:

```sh
PUBLIC_SANITY_PROJECT_ID=yllq4mvh
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2026-04-19
SANITY_API_READ_TOKEN=
```

`SANITY_API_READ_TOKEN` is only needed for local import/repair scripts. It is not shipped to the public frontend.

## Local Development

```sh
npm run dev
```

Local Studio is available at:

```txt
http://127.0.0.1:4321/studio/
```

## Build And Preview

```sh
npm run build
npm run preview
```

The build command:

- prepares Sanity Studio env config,
- builds the embedded Studio into `public/studio`,
- builds the Astro static site,
- flattens routes so legacy URLs like `/bio.html` continue to work.

Check generated routes:

```sh
npm run check:routes
```

## Deploy Public Website To Netlify

Netlify is the production deploy target.

Netlify settings:

```txt
Build command: npm run build
Publish directory: dist
Node version: 22
```

The same settings are committed in `netlify.toml`.

Code deploy flow:

```sh
git push origin codex/sanity-rebuild
```

Netlify should be connected to the GitHub repo/branch and will build from the pushed code. Netlify HTML Pretty URLs are disabled in `netlify.toml` so links stay as `.html` URLs.

## Deploy After Sanity Content Edits

The public site is statically generated. Public pages read Sanity at build time, not on every browser request.

That means published Sanity content needs a Netlify rebuild before it appears on the live public site.

Recommended setup:

1. In Netlify, create a Build Hook for this site.
2. In Sanity project settings, create a webhook that fires on publish events.
3. Set the Sanity webhook URL to the Netlify Build Hook URL.
4. After a client publishes content in Sanity, Sanity triggers Netlify, Netlify rebuilds, and the static site updates.

Manual fallback:

```sh
curl -X POST "$NETLIFY_BUILD_HOOK_URL"
```

Do not commit the build hook URL.

## Deploy Sanity Studio

Deploy Studio when schema or Studio config changes, for example after editing files in `sanity/schemaTypes/` or `sanity.config.ts`.

```sh
npx sanity deploy --yes
```

Hosted Studio:

```txt
https://chanelle.sanity.studio/
```

The embedded `/studio/` version is rebuilt automatically as part of `npm run build` and deployed with the Netlify site.

## Useful Content Scripts

Initial content migration:

```sh
npm run migrate:content
```

Restore old news spacer blocks as editable decal divider blocks:

```sh
npm run restore:news-dividers
```

These scripts write to Sanity, so only run them intentionally.

## Legacy GitHub Pages Workflow

There is a GitHub Pages workflow in `.github/workflows/deploy.yml`, but Netlify is the active deploy path. Do not use the GitHub Pages workflow unless the hosting strategy is intentionally switched back.
