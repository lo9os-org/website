import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { checkSyntax } from './syntax.mjs';
import path from 'node:path';
import { root, languages, loadApps, render, route, escape } from './build.mjs';
import { copy } from '../src/copy.mjs';

await checkSyntax();
const apps = await loadApps();
const tree = value => Array.isArray(value) ? value.map(tree) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, tree(value[key])])) : typeof value;
assert.deepEqual(tree(copy.ko), tree(copy.en), 'Site translations must have matching keys and types.');
assert.equal(escape('<script>"x" & \'y\'</script>'), '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;');
const hostile = structuredClone(apps[0]);
hostile.name = '<img src=x onerror=alert(1)>';
hostile.description.ko = '<script>alert(1)</script>';
const escaped = render('ko', 'home', [hostile]);
assert.ok(!escaped.includes(hostile.name) && !escaped.includes(hostile.description.ko), 'Catalog strings must be escaped in generated HTML.');

const manifest = JSON.parse(await readFile(path.join(root, 'ASSETS.json'), 'utf8'));
for (const asset of manifest) {
  for (const directory of ['assets', 'dist/assets']) {
    const digest = createHash('sha256').update(await readFile(path.join(root, directory, asset.file))).digest('hex');
    assert.equal(digest, asset.sha256, `Asset changed: ${directory}/${asset.file}`);
  }
}

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

const output = path.join(root, 'dist');
const htmlFiles = (await files(output)).filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  assert.ok(!html.includes('undefined'), `Unresolved copy in ${file}`);
  assert.ok(/<html lang="(ko|en)"/.test(html), `Missing language in ${file}`);
  assert.ok(/<title>.+<\/title>/.test(html), `Missing title in ${file}`);
  assert.ok(/<meta name="description" content="[^"]+"/.test(html), `Missing description in ${file}`);
  assert.ok(!/https?:\/\/localhost|concept-switch|data-ko=|data-en=/.test(html), `Development content in ${file}`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1].replaceAll('&amp;', '&');
    if (/^(https:|mailto:)/.test(ref)) continue;
    assert.ok(ref.startsWith('/') || ref.startsWith('#'), `Unexpected URL ${ref} in ${file}`);
    const url = new URL(ref, `https://lo9os.org/${path.relative(output, file)}`);
    const local = path.join(output, url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname);
    assert.ok((await stat(local)).isFile(), `Broken local URL ${ref} in ${file}`);
    if (url.hash) {
      const target = local === file ? ids : new Set([...(await readFile(local, 'utf8')).matchAll(/\bid="([^"]+)"/g)].map(value => value[1]));
      assert.ok(target.has(url.hash.slice(1)), `Missing fragment ${ref} in ${file}`);
    }
  }
}
assert.equal(htmlFiles.length, languages.length * 3, 'Expected home, privacy and 404 in both languages.');
for (const lang of languages) {
  const filename = path.join(output, route(lang), 'index.html');
  assert.ok((await readFile(filename, 'utf8')).includes(escape(apps[0].description[lang])));
}

function luminance(hex) {
  const linear = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
const pairs = [['#171c36', '#ffffff'], ['#596278', '#ffffff'], ['#293cff', '#ffffff'], ['#4b536a', '#ffffff'], ['#171c36', '#edf0f7']];
const ratios = pairs.map(([front, back]) => {
  const values = [luminance(front), luminance(back)].sort((a, b) => b - a);
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  assert.ok(ratio >= 4.5, `Insufficient text contrast: ${front} / ${back}`);
  return `${front}/${back}: ${ratio.toFixed(2)}:1`;
});
console.log(`Passed catalog validation, translation coverage, escaping, ${manifest.length} source + copied asset hashes, and local URLs in ${htmlFiles.length} pages.`);
console.log(`Text contrast: ${ratios.join(', ')}`);
