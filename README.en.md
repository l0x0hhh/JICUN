# JICUN · Landing Page

> The product page for the JICUN app: what it solves, and a download button that is impossible to miss.

A purely static single page (Vite + React + TypeScript). **No backend is needed once it is deployed.** The page ships in Chinese and English, follows the browser language by default, and accepts `?lang=zh` / `?lang=en`.

- Stack: Vite · React 19 · TypeScript · motion (scroll parallax) · lucide-react (icons)
- Styling: everything lives in `src/styles.css` — no CSS framework, no preprocessor
- Fonts: **fully self-hosted**, no requests to Google Fonts (slow or blocked from mainland China, and it would hold up first paint)
- The download buttons point at an **APK hosted by this site itself** (`public/downloads/jicun.apk`): same-origin direct download, no interstitial page, no jump to GitHub or Gitee
- **The APK updates itself**: an app release pushes it straight into this repo (the main path — see `LANDING_TOKEN` in the zongce repo), and `.github/workflows/sync-apk.yml` pulls the latest once a day as a fallback

> **Independent project notice**: JICUN is an independent personal project with no affiliation to any school or educational institution.

## Local development

Requires Node.js 20 or newer (developed on Node 22).

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server (Vite, port 5173 by default) |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serves the built output locally |

`npm run build` runs `tsc -b && vite build`. To check that it bundles without waiting for the type-check, run `npx vite build` directly.

## Layout

```
index.html            # entry: favicon, title, description
public/
  logo.png            # brand mark (shared by the page and the icons)
  favicon.ico|16|32   # tab icons (tightly cropped variants)
  apple-touch-icon.png
  fonts/              # self-hosted font subsets
src/
  main.tsx            # mount entry
  App.tsx             # page structure, scroll parallax and motion; all outbound URLs live at the top
  i18n.ts             # zh / en copy dictionaries (the two must stay in sync)
  styles.css          # all styles
scripts/
  subset-fonts.py     # regenerates the font subsets (see below)
vite.config.ts
```

## Where to change things

- **Copy** → `zh` and `en` in `src/i18n.ts`. TypeScript forces the two dictionaries to stay structurally identical (a missing key in `en` is a compile error). Switching language also syncs `<html lang>` and the page title, and the choice is remembered in `localStorage['jicun-lang']`.
- **Download URL / outbound links** → `DOWNLOAD_URL`, `REPO_URL`, `README_URL`, `LICENSE_URL` at the top of `src/App.tsx`. **`DOWNLOAD_URL` points at the in-site file `/downloads/jicun.apk` and you should not need to touch it on a release** — the APK is synced automatically (see below).
- **Why the APK is self-hosted instead of linking a Releases page**: Android browsers decide "is this an installer?" purely from the response `Content-Type`. Third-party file hosts/CDNs (Gitee attachments, for example) label `.apk` as `application/zip`, so the browser saves `xxx.zip` and users must rename it; mobile may also show an interstitial page. That is why `netlify.toml` forces `Content-Type: application/vnd.android.package-archive` and `Content-Disposition: attachment` for `/downloads/*`.
- **How the APK stays in sync**: two paths, each backing the other up. ① Main path — when the app repo cuts a release, its `release.yml` pushes the APK straight into this repo's `public/downloads/jicun.apk` (requires `LANDING_TOKEN` on the app repo; skipped if unset). ② Fallback — this repo's `.github/workflows/sync-apk.yml` pulls the latest from the app's newest release once a day (09:17 Beijing time), and can also be run manually from Actions. The app repo is public, so the fallback needs **no credentials at all**.
- **Structure or styling** → `src/App.tsx` + `src/styles.css`.

## Fonts (read this after editing copy)

The page uses **subsetted-to-current-glyphs** Noto Sans SC (a variable font covering weights 400–800) and Space Mono 400 / 700, stored in `public/fonts/`. The subsets are a static snapshot: **as soon as new characters appear in the copy you must regenerate them**, otherwise those characters fall back to a system font and two different typefaces show up on the same screen.

```bash
npm run dev                                  # the script reads visible characters from the rendered DOM, so the server must be running
python scripts/subset-fonts.py               # defaults to http://127.0.0.1:5173
python scripts/subset-fonts.py 5174          # or pass a port
```

The script requests the subsets from Google Fonts and overwrites `public/fonts/`. Rebuild afterwards. It also prints how many unique characters it collected, so you can sanity-check the result.

## Design rules

These directions are settled — check before changing them:

- **Headings must clearly outweigh body copy**: H1 is weight `800` with a `clamp()` ceiling of 112px; the content column is 1440px.
- **No small kicker labels**: an earlier round had them, they were all removed — do not bring them back.
- **Scroll parallax** is handled by motion's `useScroll` / `useTransform` / `useSpring`, never a hand-rolled `requestAnimationFrame`; it is disabled automatically when the user prefers reduced motion. Note that **motion's inline `transform` overrides CSS `transform`**, so `rotate` must be handed to motion as well.
- **Minimum type sizes**: page-level text ≥ 12.5px, inside the phone mockups ≥ 8px.
- **Rules and dividers belong to the container, not to a card's `border`** — a card that `translateY`s on hover drags its border with it, and the line pokes out of the frame.
- **Use `overflow: clip` with care**: it trims elements that stick out (`right: -Npx`, the bounding box of a `rotate()`), flattening rounded corners into a hard straight edge. When you do need to clip decoration, wrap it in a dedicated clipping container.

## Deployment

**Not deployed yet.** The output is plain static files (`dist/`), so it can go to any static host: object storage + CDN, Vercel / Netlify, GitHub Pages, and so on.

If you deploy under a **sub-path** (for example GitHub Pages at `https://<user>.github.io/<repo>/`), you must set `base` in `vite.config.ts` — otherwise absolute paths such as `/logo.png` and `/fonts/*` will 404.

## Relation to the app repository

| Repository | Contents |
| --- | --- |
| [`l0x0hhh/zongce`](https://github.com/l0x0hhh/zongce) | The JICUN Android app (Kotlin + Jetpack Compose + Room) |
| This repository | The app's product page; the APK is hosted here too (`public/downloads/jicun.apk`) |

The two are independent: this repository does not depend on the app's code, and does not need the app to be built first.

## License

[MIT](LICENSE)
