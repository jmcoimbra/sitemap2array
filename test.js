'use strict';

const assert = require('node:assert');
const { test, mock } = require('node:test');
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

test('parseSitemapXml extracts URLs from urlset', () => {
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

  const result = parseSitemapXml(xml);
  assert.deepStrictEqual(result.urls, [
    'https://example.com/page1',
    'https://example.com/page2',
  ]);
  assert.strictEqual(result.isSitemapIndex, false);
});

test('parseSitemapXml detects sitemapindex', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-2.xml</loc>
  </sitemap>
</sitemapindex>`;

  const result = parseSitemapXml(xml);
  assert.deepStrictEqual(result.urls, [
    'https://example.com/sitemap-1.xml',
    'https://example.com/sitemap-2.xml',
  ]);
  assert.strictEqual(result.isSitemapIndex, true);
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

  const result = parseSitemapXml(xml);
  assert.deepStrictEqual(result.urls, ['https://example.com/valid']);
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

// --- sitemap index resolution (with mocked fetch) ---

test('sitemap2array follows sitemap index by default', async (t) => {
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
</sitemapindex>`;

  const sitemap1Xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/a</loc></url>
  <url><loc>https://example.com/b</loc></url>
</urlset>`;

  const sitemap2Xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/c</loc></url>
</urlset>`;

  const responses = {
    'https://example.com/sitemap-index.xml': indexXml,
    'https://example.com/sitemap-1.xml': sitemap1Xml,
    'https://example.com/sitemap-2.xml': sitemap2Xml,
  };

  t.mock.method(globalThis, 'fetch', (url) => {
    const body = responses[url];
    if (!body) return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
    return Promise.resolve({ ok: true, text: () => Promise.resolve(body) });
  });

  const urls = await sitemap2array('https://example.com/sitemap-index.xml');
  assert.deepStrictEqual(urls, [
    'https://example.com/a',
    'https://example.com/b',
    'https://example.com/c',
  ]);
});

test('sitemap2array returns sitemap URLs when followIndex is false', async (t) => {
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
</sitemapindex>`;

  t.mock.method(globalThis, 'fetch', () => {
    return Promise.resolve({ ok: true, text: () => Promise.resolve(indexXml) });
  });

  const urls = await sitemap2array('https://example.com/sitemap-index.xml', { followIndex: false });
  assert.deepStrictEqual(urls, [
    'https://example.com/sitemap-1.xml',
    'https://example.com/sitemap-2.xml',
  ]);
});

test('sitemap2array returns page URLs directly for urlset', async (t) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page1</loc></url>
</urlset>`;

  t.mock.method(globalThis, 'fetch', () => {
    return Promise.resolve({ ok: true, text: () => Promise.resolve(xml) });
  });

  const urls = await sitemap2array('https://example.com/sitemap.xml');
  assert.deepStrictEqual(urls, ['https://example.com/page1']);
});
