# Reformd — Webflow custom code

TypeScript + esbuild toolchain for Webflow client sites — JS **and** CSS.
Dev = localhost live reload · Staging = auto-deploy on push · Prod = pinned jsDelivr tag.

Source files: `src/index.ts` (bundled to `dist/index.js`) and `src/styles.css`
(minified to `dist/styles.css`). Both ship together under one version tag.

The Webflow Designer owns layout and classes. Nothing in this repo generates
markup.

## Project

| Resource | Value |
| --- | --- |
| Repository | [brandvm/reformdd](https://github.com/brandvm/reformdd) |
| Webflow site | Reformd — `6aa30843ef516b660e7d8770` |
| Home page | `6aa30847ef516b660e7d877b` |
| Designer | [Open Reformd](https://reformdd.design.webflow.com) |
| Staging website | [reformdd.webflow.io](https://reformdd.webflow.io) |
| Staging bundles | `https://brandvm.github.io/reformdd/` |
| Development | `http://localhost:3000/` |
| Initial release | `v0.1.0` |

The site starts with one Home page. Brand content, layout, and a custom
domain will be configured as the project develops.

## Requirements

- [Node](https://nodejs.org) 22 (the version CI builds with)
- [pnpm](https://pnpm.io/installation) 11 — `corepack enable`

```bash
nvm use
pnpm install
```

## Commands

```bash
pnpm dev      # esbuild watch + server on :3000 (unminified, sourcemaps)
pnpm build    # minified -> dist/
pnpm check    # tsc --noEmit
```

## Webflow integration

The three snippets in [`loader.html`](loader.html) are configured for this
repository: site head code, two canvas CSS Embeds (2a link, 2b script), and
site footer code. The Embeds live in the reusable **Global Components**
component.
Include one instance on every new page, before the visible page content.
Site custom code does not render in the Designer.

GitHub Pages uses **GitHub Actions** as its source. Pushes to `master` run
the type check and build, then deploy `dist/`. The staging workflow can also
be run manually from the repository's Actions tab.

`loader.html` is the checked-in source for the installed Webflow snippets.
Changes to it must also be applied in Webflow and published; pushing the
repository only updates the external JS and CSS bundles.

## Daily

- Run `pnpm dev`, then open the `.webflow.io` site with `?wfc-dev=1` to load the
  local bundle (remembered in localStorage); `?wfc-dev=0` switches back to staging.
  Bench does this for you in its preview.
- `git push` → client-facing staging bundle updates in ~1 min (no Webflow publish)
- Live reload works in the browser. It does **not** work on the Designer canvas,
  which never runs scripts — reload the Designer tab instead.

The loader records which bundle actually executed in `window.WFC.source`; if
localhost fails it falls back to staging and re-points `wfc-css` to match.

## Release (launch / retainer updates)

```
pnpm build
git add -f dist && git commit -m "release: vX.Y.Z"
git tag vX.Y.Z && git push && git push --tags
git rm -r --cached dist && git commit -m "chore: untrack dist after vX.Y.Z"
git push
```

`dist/` is gitignored for day-to-day work, so the `-f` is required — without
it the release commit is empty, the tag carries no build, and jsDelivr serves
a 404 to the live site.

The un-track at the end is not optional tidying. `.gitignore` only governs
files git is not already *tracking*, so the release commit permanently
cancels the ignore rule for `dist/`: from that point on every rebuild shows
as a modification and `git add .` sweeps a minified bundle into whatever
commit you are writing. `--cached` un-tracks it but leaves the files on
disk, so the ignore rule applies again. The tag is untouched — it still
points at the commit that contains the build, and jsDelivr serves that
forever.

Then set `RELEASE` in the Webflow head snippet (the only version string) →
publish staging → verify → publish prod.
Rollback = set `RELEASE` back to the previous tag and publish. Never use `@latest` or branch URLs in prod.

**Tag rules (learned the hard way):**

- `dist/` must be committed *before* the tag is pushed
- A pushed tag must **never** be moved (`tag -f`) — jsDelivr snapshots a
  version once and keeps it forever, so a half-baked snapshot is permanent.
  Botched release? Cut the next patch version instead
- Un-track `dist/` again once the tag is pushed, or the ignore rule stays
  dead for every commit after the first release

**Before attaching a custom domain,** confirm the repo actually has the tag
`RELEASE` points at. A site running on `.webflow.io` never touches the prod
URLs. While `RELEASE` is `null`, a custom domain serves the staging bundle
and logs a console error rather than 404ing.

## How the files reach the page

Three snippets, documented in [`loader.html`](loader.html) — read that file
before touching any of them.

| Environment    | Source                  |
| -------------- | ----------------------- |
| Production     | pinned jsDelivr tag     |
| `*.webflow.io` | GitHub Pages staging    |
| `?wfc-dev=1`    | `http://localhost:3000` |

Dev mode is localhost-only by design: `http://localhost` is a
potentially-trustworthy origin so an https page may load it, but a LAN IP is
not and gets blocked as mixed content. To check work on another device, push
and use the staging bundle.

Pushing to `master` triggers
[`.github/workflows/staging.yml`](.github/workflows/staging.yml), which runs
`pnpm build` and publishes `dist/` to GitHub Pages. Production is pinned to a
tag, so a staging deploy never touches the live site.

## Project structure

```
src/
  index.ts            entry point; a manifest of module imports and calls
  styles.css          CSS manifest; cascade notes and the @import order
  styles/             one file per numbered section, 01-tokens .. 08-editor
    05-components/    one file per component, ordered by its _index.css
  modules/            one file per feature, each exporting an init function
  globals.d.ts        types for the globals the loader and Webflow set
tests/                Playwright checks; browser-level, no server needed
build.mjs             esbuild config and dev server
loader.html           the three Webflow snippets, documented
```

`src/styles.css` holds no rules: it is the cascade notes plus the @import
list that esbuild inlines into one sheet, so that list is where section order
is written down. Order is the tiebreaker for same-specificity rules — add to
the file whose section a rule belongs to, and within §05 to the component's
own file, never to whichever file is already open.

TypeScript runs `strict`, targets ES2019, and defines no path aliases —
imports are relative.

## Webflow MCP

`.mcp.json` carries the Webflow MCP server definition. Approve the project
server on first launch, then run `/mcp` to authorise Webflow — OAuth is
per-machine, so this is repeated on each new machine.

## Auditing before launch

Before shipping, check every JS module and CSS block against the live markup —
modules whose selectors/attributes appear on no page are dead weight
(the TeraWulf migration dropped 5 of 7 inherited modules this way).

## Handoff (site leaving the agency)

Build → paste `dist/index.js` inline into Site footer, CSS inline into the
canvas Embed → remove loader + external tags → publish → zip `src/` for the
client → archive repo.
