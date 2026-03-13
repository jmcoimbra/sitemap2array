# sitemap2array

Fetch a sitemap.xml URL and return its URLs as an array. Automatically resolves sitemap index files.

## Install

```
npm install sitemap2array
```

## Usage

```js
const sitemap2array = require('sitemap2array');

// Regular sitemap — returns page URLs
const urls = await sitemap2array('https://example.com/sitemap.xml');
// ['https://example.com/page1', 'https://example.com/page2', ...]

// Sitemap index — automatically fetches all child sitemaps and returns all page URLs
const allUrls = await sitemap2array('https://example.com/sitemap-index.xml');
// ['https://example.com/page1', ..., 'https://example.com/page500']
```

## Options

### `followIndex`

When `true` (default), sitemap index files are resolved recursively — each child sitemap is fetched in parallel and all page URLs are flattened into a single array.

Set to `false` to get just the child sitemap URLs without following them:

```js
const sitemapUrls = await sitemap2array('https://example.com/sitemap-index.xml', {
  followIndex: false,
});
// ['https://example.com/sitemap-1.xml', 'https://example.com/sitemap-2.xml']
```

## API

### sitemap2array(url, [options])

Returns a `Promise<string[]>`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | — | Full URL to a sitemap.xml (must include `http://` or `https://`) |
| `options.followIndex` | `boolean` | `true` | Recursively fetch child sitemaps from sitemap index files |

Supports both `<urlset>` (standard sitemaps) and `<sitemapindex>` (sitemap index files) per the [sitemaps.org protocol](https://www.sitemaps.org/protocol.html).

Recursive depth is capped at 3 levels to prevent infinite loops.

## Requirements

Node.js >= 18 (uses native `fetch`).

## License

MIT
