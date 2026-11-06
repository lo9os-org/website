# lo9os

Public app catalog for [lo9os.org](https://lo9os.org). The initial catalog introduces Design Pick and links to its independent product website. Product source code lives in separate repositories.

## Build and check

Use Node.js 22 or newer. No package installation, framework, API keys, or runtime dependencies are required.

```sh
npm run build
npm run check
```

The build writes a complete static site to `dist/`. Serve that directory with any static web server for local review. It contains Korean and English pages, site privacy notices, custom 404 pages, a sitemap, robots.txt, and local assets. The language links work without JavaScript. JavaScript remembers only the chosen language in local storage; no analytics, forms, or backend are included.

## Publish with Cloudflare Pages

Connect this repository to a Cloudflare Pages project and choose the production branch. Select no framework preset, use `npm run build` as the build command, and `dist` as the output directory. Set the build's Node.js version to 22 or newer if needed. Add `lo9os.org` as a custom domain in the Pages dashboard and follow its DNS instructions. Preserve unrelated DNS records, including mail records. After deployment, verify `/`, `/en/`, `/privacy/`, and an unknown URL on the production domain.

`dist/` is generated and is not committed. There is no deployment workflow or hosting configuration file in this repository.

## Add an app

1. Add an entry to `data/apps.json`. Copy the existing entry's shape, choose a unique lowercase `id`, and supply a public HTTPS product URL. Every copy field needs both `ko` and `en` text.
2. Add its image to `assets/`, reference the filename in `image`, and provide its actual pixel dimensions and translated alt text. Keep imagery accurate and distinguish illustrations from screenshots.
3. Use `release` and `availability` to state the real release and sales status. An app under review should link to its introduction, without suggesting an unavailable install or checkout action.
4. Run the build and checks, then review both languages at mobile and desktop sizes, keyboard navigation, and link destinations.

The layout renders catalog entries automatically; adding an app does not require template changes. Site copy lives in `src/copy.mjs`, layout generation in `scripts/build.mjs`, and shared styling and language persistence in `public/`.

## Assets and verification

`ASSETS.json` records the provenance and SHA-256 digests of the reused Design Pick images and its original favicon. Those files remain unchanged. The site's own blue lo9os favicon is `public/favicon.svg`.

`npm run check` checks catalog fields and links, translation coverage, HTML escaping, generated local references, source asset hashes, and text color contrast. Browser rendering and real keyboard interaction require a separate visual review.
