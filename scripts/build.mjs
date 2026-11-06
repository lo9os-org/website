import { readFile, writeFile, mkdir, rm, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { copy } from '../src/copy.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const languages = ['ko', 'en'];
export const origin = 'https://lo9os.org';
export const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const route = (lang, page = 'home') => `${lang === 'en' ? '/en' : ''}${page === 'home' ? '/' : page === 'privacy' ? '/privacy/' : '/404.html'}`;
const e = escape;

export async function loadApps() {
  const apps = JSON.parse(await readFile(path.join(root, 'data/apps.json'), 'utf8'));
  if (!Array.isArray(apps) || apps.length === 0) throw new Error('The catalog must contain at least one app.');
  const ids = new Set();
  for (const app of apps) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(app.id) || ids.has(app.id)) throw new Error('App IDs must be unique lowercase slugs.');
    ids.add(app.id);
    if (typeof app.name !== 'string' || !app.name.trim()) throw new Error(`${app.id}: name is required.`);
    const url = new URL(app.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${app.id}: use a public HTTPS product URL.`);
    if (typeof app.image !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp|avif|svg)$/.test(app.image)) throw new Error(`${app.id}: use an image filename from assets/.`);
    await access(path.join(root, 'assets', app.image));
    if (![app.imageWidth, app.imageHeight].every(value => Number.isInteger(value) && value > 0)) throw new Error(`${app.id}: image dimensions must be positive integers.`);
    for (const field of ['kind', 'description', 'cta', 'release', 'availability', 'imageAlt', 'imageCaption']) {
      for (const lang of languages) if (typeof app[field]?.[lang] !== 'string' || !app[field][lang].trim()) throw new Error(`${app.id}: missing ${field}.${lang}.`);
    }
  }
  return apps;
}

const arrow = '<svg class="external" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h10v10M16 4 4 16"/></svg>';

function header(lang, page) {
  const c = copy[lang];
  return `<a class="skip" href="#main">${e(c.skip)}</a>
  <header class="site-header wrap">
    <a class="wordmark" href="${route(lang)}" aria-label="${e(c.home)}">lo<span>9</span>os</a>
    <div class="header-right">
      <nav class="main-nav" aria-label="${e(c.nav)}"><a href="${route(lang)}#apps">${e(c.apps)}</a><a href="mailto:contact@lo9os.org">${e(c.contact)}</a></nav>
      <nav class="languages" aria-label="${e(c.languages)}">
        <a href="${route('ko', page)}" lang="ko" hreflang="ko" data-language="ko"${lang === 'ko' ? ' aria-current="page"' : ''}>한국어</a>
        <a href="${route('en', page)}" lang="en" hreflang="en" data-language="en"${lang === 'en' ? ' aria-current="page"' : ''}>EN</a>
      </nav>
    </div>
  </header>`;
}

function footer(lang) {
  const c = copy[lang];
  return `<footer class="site-footer wrap"><div class="footer-contact"><a href="mailto:contact@lo9os.org">contact@lo9os.org</a><p>${e(c.footer)}</p></div><div class="footer-meta"><a href="${route(lang, 'privacy')}">${e(c.privacy)}</a><span>© 2026 lo9os</span></div></footer>`;
}

function card(app, lang, index) {
  return `<article class="feature" aria-labelledby="${e(app.id)}-title">
    <div class="feature-copy"><p class="kind">${e(app.kind[lang])}</p>
      <div class="product-heading"><span class="product-icon" aria-hidden="true"></span><h2 id="${e(app.id)}-title">${e(app.name)}</h2></div>
      <p class="product-text">${e(app.description[lang])}</p>
      <a class="primary" href="${e(app.url)}"><span>${e(app.cta[lang])}</span>${arrow}</a>
      <p class="status">${e(app.release[lang])}</p><p class="availability">${e(app.availability[lang])}</p>
    </div>
    <figure class="product-art"><img src="/assets/${e(app.image)}" width="${app.imageWidth}" height="${app.imageHeight}" alt="${e(app.imageAlt[lang])}"${index === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}><figcaption>${e(app.imageCaption[lang])}</figcaption></figure>
  </article>`;
}

function content(lang, page, apps) {
  const c = copy[lang];
  if (page === 'privacy') return `<main id="main" class="document wrap" tabindex="-1"><h1>${e(c.privacyHeading)}</h1><p class="document-date">${e(c.updated)}</p><p>${e(c.privacyIntro)}</p>${c.privacySections.map(section => `<section><h2>${e(section.heading)}</h2><p>${e(section.text)}</p>${section.link ? `<a class="plain-link" href="${e(section.link)}">${e(section.label)}</a>` : ''}</section>`).join('')}<a class="plain-link back-link" href="${route(lang)}">${e(c.back)}</a></main>`;
  if (page === '404') return `<main id="main" class="not-found wrap" tabindex="-1"><p class="error-code">404</p><h1>${e(c.notFound)}</h1><p>${e(c.notFoundText)}</p><a class="primary" href="${route(lang)}">${e(c.back)}</a></main>`;
  return `<main id="main" class="catalog wrap" tabindex="-1">
    <section class="intro"><h1>${c.hero.map(e).join('<br>')}</h1><p>${e(c.intro)}</p></section>
    <section id="apps" class="apps" aria-label="${e(c.apps)}">${apps.map((app, index) => card(app, lang, index)).join('')}</section>
    <div class="next-tool"><p><strong>${e(c.nextTitle)}</strong><span>${e(c.next)}</span></p><a class="plain-link" href="mailto:contact@lo9os.org">${e(c.conversation)}</a></div>
  </main>`;
}

export function render(lang, page, apps) {
  const c = copy[lang];
  const title = page === 'home' ? c.title : page === 'privacy' ? c.privacyTitle : c.notFoundTitle;
  const description = page === 'home' ? c.description : page === 'privacy' ? c.privacyDescription : c.notFoundDescription;
  const url = `${origin}${route(lang, page)}`;
  return `<!doctype html>
<html lang="${lang}" data-page="${page}">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)}</title><meta name="description" content="${e(description)}">
  <meta name="theme-color" content="#ffffff"><meta name="color-scheme" content="light">
  ${page === '404' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">${languages.map(value => `<link rel="alternate" hreflang="${value}" href="${origin}${route(value, page)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin}${route('ko', page)}">`}
  <meta property="og:type" content="website"><meta property="og:site_name" content="lo9os"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="${lang === 'ko' ? 'ko_KR' : 'en_US'}"><meta property="og:image" content="${origin}/assets/brand-flow.png"><meta property="og:image:width" content="1536"><meta property="og:image:height" content="1024"><meta property="og:image:alt" content="${e(c.illustration)}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${origin}/assets/brand-flow.png"><meta name="twitter:image:alt" content="${e(c.illustration)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/site.css"><script src="/site.js" defer></script>
</head>
<body>${header(lang, page)}${content(lang, page, apps)}${footer(lang)}</body>
</html>
`;
}

export async function build() {
  const apps = await loadApps();
  const output = path.join(root, 'dist');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(root, 'public'), output, { recursive: true });
  await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
  for (const lang of languages) {
    for (const page of ['home', 'privacy', '404']) {
      const pathname = route(lang, page);
      const target = path.join(output, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, render(lang, page, apps));
    }
  }
  await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  const urls = languages.flatMap(lang => ['home', 'privacy'].map(page => `${origin}${route(lang, page)}`));
  await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
  console.log(`Built ${apps.length} app(s), 2 languages, privacy notices and custom 404 pages → dist/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
