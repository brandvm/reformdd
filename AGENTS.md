# Reformd — Webflow custom code

Agent instructions for this repository. Codex, Cursor and similar tools read
this file directly; Claude Code reads it through `CLAUDE.md`. It is the single
source of agent rules — edit this file, never a copy of it.

This repository contains custom TypeScript and CSS for the Reformd Webflow
site. Webflow owns markup, layout, components, and CMS content.

## Project facts

- Client / site: Reformd
- GitHub: `brandvm/reformdd`, default branch `master`
- Webflow site ID: `6aa30843ef516b660e7d8770`
- Webflow MCP server: `webflow-reformdd` (`.mcp.json`)
- Home page ID: `6aa30847ef516b660e7d877b`
- Designer: `https://reformdd.design.webflow.com`
- Staging site: `https://reformdd.webflow.io`
- Staging bundles: `https://brandvm.github.io/reformdd/`
- Production bundles: `https://cdn.jsdelivr.net/gh/brandvm/reformdd@<RELEASE>/dist/`
- Production domain: not attached yet
- Production release: `v1.0.0` (`RELEASE = "1.0.0"` in the head snippet
  of `loader.html`)

## Who owns what

Webflow owns markup, layout, classes, components, CMS content, interactions
**and styling by default**. This repo owns JavaScript behaviour and only the
CSS the Designer cannot express.

That split is deliberate. Repo CSS loads from an Embed after `webflow.css`,
so it wins every specificity tie against the Designer. Any rule written here
that the Designer could have expressed becomes a hidden override: the next
person changes that style in the Designer, nothing happens, and the only fix
is edit `src/` → push → wait for staging → reload the Designer. Every project
built from this template has lost time to that loop.

## CSS policy — Designer first

Existing rules predate this policy and are untagged; add a `repo-css` tag to
any rule you touch, and question rules the Designer could own.

Before writing any CSS, decide where it belongs.

1. **Can the Designer do it?** A class or combo class style, a variable, a
   breakpoint style, a state (hover/focus/current), an interaction. If yes:
   - With the Webflow MCP connected, apply it in Webflow (styles and
     variables tools), then tell the user what was changed.
   - Without the MCP, give the user exact Designer steps: class, breakpoint,
     property, value.
   - Do **not** add it to `src/styles/`.
2. **Repo CSS needs a reason.** Every rule — or the section header comment
   covering a group of rules — carries one tag from this list:

   ```css
   /* repo-css: <tag> — <short why> */
   ```

   | Tag | Use for |
   | --- | --- |
   | `js-state` | Classes/attributes a module toggles (`.is-open`, `.is-loading`, `[data-state]`) |
   | `designer-cant` | Name the feature: `:has()`, complex combinators, `@keyframes`, `@supports`, container queries, `::marker`, `color-mix()`, masks |
   | `third-party` | Swiper, Lenis, Finsweet or other library markup |
   | `canvas-preview` | `.w-editor`, `.wf-design-mode`, `html:not([data-wf-domain])` helpers |
   | `approved-base` | A site-wide base the user explicitly asked to keep in code |
   | `override-webflow` | Overriding a `.w-*` default or a Designer style |

3. **`override-webflow` needs the user's explicit approval** and a
   `GOTCHAS.md` entry explaining why. Ask before writing it.
4. **Never, without that approval:** set `font-size` on `:root`/`html`,
   neutralize `.w-*` defaults, or reference Webflow variable names
   (`--_layout---…`, `--_typography---…`). A renamed variable in Webflow
   silently breaks every rule that reads it — Webflow rewrites its own
   references, never this bundle's.
5. **Ambiguous request?** Say which parts go in the Designer and which go in
   code before editing anything. "Make the heading bigger on mobile" is a
   Designer breakpoint style, not a media query here.

Pre-existing exceptions in this repo, all predating the policy (log any
change to them in `GOTCHAS.md`):

- `01-tokens.css` sets the fluid root `font-size` (ideal 1440, max 1920px,
  plus 834 / 430 tablet and phone ramps).
- Webflow variable names are referenced in `01-tokens.css`
  (`--_layout---nav--height-scrolled`), `07-accessibility.css`
  (`--_colors---brand--green`) and `08-editor-dev-supports.css`
  (`--_spacing---…`, `--_colors-semantic---…`, `--_typography-…`). Check
  them whenever a variable is renamed in Webflow.
- `03-webflow-neutralizers.css` still holds the neutralizers that survived
  c2e5f4b (including `.w-nav`).

## Read before changing integration

Read `README.md` and `loader.html` before changing integration or releases.
Use the connected Webflow tools to verify the target site and discover any
site instructions before writing. Keep one Global Components component
instance on each page. Record installed snippet changes in `loader.html`.

- `loader.html` — the three pieces: site head code (config and release),
  two CSS Embeds (2a the `<link>`, 2b the `<script>`, inside the reusable
  **Global Components** component, one instance on every page, before the
  visible content) and site footer code.
- Feature modules belong in `src/modules/`; `src/index.ts` is the
  entry-point manifest. Each module must no-op when its target markup is
  absent. Each init is wrapped in `run(name, init)` with try/catch so one
  throwing module cannot stop the rest.
- Follow the cascade notes in `src/styles.css`, which is an @import manifest
  only — rules live in `src/styles/` (one file per numbered section,
  components one file each under `05-components/`, ordered by its
  `_index.css`). Import order is the tiebreaker; add a rule to the file
  whose section it belongs to, never to whichever file is already open.
- Third-party libraries are bundled with `pnpm add` (GSAP, Lenis), not added
  as CDN tags.
- Lenis sets `window.lenis = { version }` itself as a marker; pass the Lenis
  instance into modules instead of probing the global (c299342).

## Webflow canvas facts

- **Repo CSS is visible on the Designer canvas**: it loads from `<link>`
  tags in the Global Components Embed (2a). Site head/footer code does not
  render in the Designer.
- **The Designer canvas never runs scripts.** Anything shown only after JS
  runs is invisible there; use a `canvas-preview` rule, or a class toggle
  rather than inline styles (dfd0338 moved feature-tab copy visibility to
  `is-open` so the Designer shows the open panel).
- **The canvas shows the staging stylesheet only.** The static localhost
  `<link>` was removed (wf-template 0.24 loader, K10 in
  `docs/handoff/LAUNCH.md`). To style against local CSS, add the
  `wfc-css-dev` link from `loader.html` › 2a temporarily, with `pnpm dev`
  running, and remove it before publishing. While it is there the two
  sheets are additive: removing a rule locally does not remove staging's
  copy, so deletions can only be verified after a push.
- No live reload on the canvas. Reload the Designer tab.
- Debug "is my CSS loading?" with `background`, not `outline` — outlines on
  `body` paint outside the canvas iframe and get clipped.
- Class renames in Webflow and the repo must land together; a revert of
  repo code must be matched by backing out the Webflow class changes
  (e9b8e87).

## Snippets are not versioned

A push updates the JS/CSS bundles only. Any change to `loader.html` must be
re-pasted into Webflow and published to take effect — say so in the commit
message, and keep `loader.html` identical to what is installed.

## Commands and release

```bash
pnpm dev      # esbuild watch + server on :3000 (unminified, sourcemaps)
pnpm build    # minified -> dist/
pnpm check    # tsc --noEmit
```

Use the pinned pnpm version and Node 22 (`.nvmrc`). Run `pnpm check` and
`pnpm build` before shipping. Pushes to `master` run
`.github/workflows/staging.yml` (check + build, deploy `dist/` to GitHub
Pages; also runnable manually).

`dist/` is ignored except in release commits. Release tags must include the
built assets and must never be moved after publication. Follow the
release/untracking sequence in the README, then set `RELEASE` in the
Webflow head snippet — the only version string since the wf-template 0.24
loader. Never use `@latest` or a branch URL in
production. History is shared across machines: revert, never reset or
force-push.

## Webflow MCP connection

Each client repo has its own MCP server name, `webflow-<slug>` in
`.mcp.json`, so each keeps its own Webflow sign-in on the machine. The
sign-in (OAuth token) never goes in the repo: these repos are public.

- Use only the server named in Project facts. Never write to Webflow
  through another client's server or the account-wide claude.ai Webflow
  connector, which may reach other clients' sites.
- Before the first write in a session, list the sites the server reaches
  and check the site ID matches Project facts. A mismatch or extra sites →
  stop and ask the user to re-authorise with only this site ticked.
- The cloud (claude.ai/code) can't run the OAuth sign-in; Webflow MCP work
  happens in a local Claude Code session opened in the workspace.

## Webflow MCP limits

Worked around, not fixed — do not rediscover these.

- `custom_value` is rejected for Color and Size variables (`color-mix()`,
  `oklch()`, `calc()`). Create those through the variables JSON import with
  `valueType: "custom"`.
- No variable rename or reorder within a collection. Rename in the Designer
  (preserves ids and aliases; recreating does not).
- The WHTML importer drops `class` attributes. Create the style, then apply
  it.
- `get_all_elements` does not descend into component definitions — pass the
  component scope. An element "missing" from a page is usually inside one.
- Concurrent Designer edits change element ids. Re-query on "Element not
  found" instead of assuming deletion.
- Responsive styles are only returned when breakpoints are requested
  explicitly (`include_breakpoints`).
- `data_element_builder` creates a TextBlock as a plain Block: its
  `set_text` is ignored and `set_text` fails on it later. Use Paragraph or
  Heading for text (`Text Style` resets their margins).
- Nothing can be built, moved or inserted next to a component instance,
  and slots take only instances. Build at body level, convert with
  `transform_element_to_component`, add it to the slot with
  `insert_in_slot` (appends to the end), then remove the body copy.
- A Collection List cannot live in a component. Inside a definition it
  takes a `source` but filters, sort and field bindings fail ("No source
  connected", "Element is not inside a CMS context"), and the Designer
  shows a conflicting-action error. Converting a section with a bound
  list is rejected. Keep CMS sections as plain page elements: Page W's
  slot accepts them (S Pricing Group, the /pricing FAQ section), placed
  via `move_element` anchored on a non-instance sibling.
- Form and field names set through `set_settings` (`name`) read back
  correctly but do not publish: the site keeps the defaults ("Email Form",
  "Name", "Field"). `placeholder` and `id` are reserved attributes (set ids
  with `set_dom_id`). Name forms and fields and type placeholders in the
  Designer.
- Webflow cannot hold two combo classes with the same name on nested
  elements of one component; pick distinct names (`is-active` vs
  `is-active-dot`, dfd0338).

`.mcp.json` carries the server definition; approve it on first launch and
run `/mcp` to authorise Webflow (OAuth, per machine).

## Session protocol

1. **Start:** read `GOTCHAS.md`. Do not repeat a mistake already logged.
2. **During:** when something surprising costs time — a Webflow quirk, a
   template default that gets in the way, an MCP limitation, a fix that had
   to be reverted — add an entry to `GOTCHAS.md` in the same commit as the
   fix, using the format at the top of that file.
3. **Scope:** tag an entry `template-candidate` when it would recur on any
   project built from `wf-template`; those entries are collected later to
   improve the template. Otherwise tag it `project`.
4. Never delete entries. Update `Status` when something is fixed or
   upstreamed.
