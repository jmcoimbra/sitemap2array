'use strict';

const assert = require('node:assert');
const { test } = require('node:test');
const { validateUrl, parseSitemapXml } = require('./index');
const sitemap2array = require('./index');

// --- validateUrl ---

test('validateUrl accepts valid sitemap URLs', () => {
  assert.strictEqual(validateUrl('https://example.com/sitemap.xml'), true);
  assert.strictEqual(validateUrl('http://example.com/sitemap.xml'), true);
  assert.strictEqual(validateUrl('https://example.com/sitemap-index.xml'), true);
  assert.strictEqual(validateUrl('https://example.com/sitemap_products.xml'), true);
  assert.strictEqual(validateUrl('https://example.com/path/sitemap.xml'), true);
});

test('validateUrl rejects invalid URLs', () => {
  assert.strictEqual(validateUrl('not-a-url'), false);
  assert.strictEqual(validateUrl('https://example.com/page.html'), false);
  assert.strictEqual(validateUrl('ftp://example.com/sitemap.xml'), false);
  assert.strictEqual(validateUrl(''), false);
  assert.strictEqual(validateUrl(123), false);
});

// --- parseSitemapXml ---

test('parseSitemapXml extracts URLs from valid sitemap', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
    <lastmod>2024-01-01</lastmod>
  </url>
  <url>
    <loc>https://example.com/page2</loc>
  </url>
</urlset>`;

  const urls = parseSitemapXml(xml);
  assert.deepStrictEqual(urls, [
    'https://example.com/page1',
    'https://example.com/page2',
  ]);
});

test('parseSitemapXml handles sitemap index', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-2.xml</loc>
  </sitemap>
</sitemapindex>`;

  const urls = parseSitemapXml(xml);
  assert.deepStrictEqual(urls, [
    'https://example.com/sitemap-1.xml',
    'https://example.com/sitemap-2.xml',
  ]);
});

test('parseSitemapXml skips entries without loc', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/valid</loc>
  </url>
  <url>
    <lastmod>2024-01-01</lastmod>
  </url>
</urlset>`;

  const urls = parseSitemapXml(xml);
  assert.deepStrictEqual(urls, ['https://example.com/valid']);
});

test('parseSitemapXml throws on invalid XML', () => {
  assert.throws(() => parseSitemapXml('not xml at all'), /Invalid sitemap XML/);
});

// --- main function ---

test('sitemap2array rejects non-string input', async () => {
  await assert.rejects(
    () => sitemap2array(123),
    { name: 'TypeError', message: 'URL parameter must be a string' }
  );
});

test('sitemap2array rejects invalid URL', async () => {
  await assert.rejects(
    () => sitemap2array('https://example.com/page.html'),
    { message: 'URL parameter is not a valid sitemap.xml URL' }
  );
});
