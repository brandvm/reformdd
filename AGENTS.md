# Reformd

This repository contains custom TypeScript and CSS for the Reformd Webflow
site. Webflow owns markup, layout, components, and CMS content.

- GitHub: `brandvm/reformdd`, default branch `master`.
- Webflow site ID: `6aa30843ef516b660e7d8770`.
- Home page ID: `6aa30847ef516b660e7d877b`.
- Staging site: `https://reformdd.webflow.io`.
- Staging bundles: `https://brandvm.github.io/reformdd/`.

Read `README.md` and `loader.html` before changing integration or releases.
Use the connected Webflow tools to verify the target site and discover any
site instructions before writing. Keep one Global Custom Code component
instance on each page. Record installed snippet changes in `loader.html`.

Feature modules belong in `src/modules/`; `src/index.ts` is the entry-point
manifest. Each module must no-op when its target markup is absent. Follow
the numbered sections and cascade notes in `src/styles.css`.

Use the pinned pnpm version and Node 22 (`.nvmrc`). Run `pnpm check` and
`pnpm build` before shipping. `dist/` is ignored except in release commits.
Release tags must include the built assets and must never be moved after
publication. Follow the release/untracking sequence in the README.
