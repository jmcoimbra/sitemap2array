# sitemap2array

Fetch a sitemap.xml URL and return its URLs as an array.

## Install

```
npm install sitemap2array
```

## Usage

```js
const sitemap2array = require('sitemap2array');

sitemap2array('https://example.com/sitemap.xml')
  .then(urls => {
    console.log(urls);
    // ['https://example.com/page1', 'https://example.com/page2', ...]
  })
  .catch(error => {
    console.error(error);
  });
```

With async/await:

```js
const sitemap2array = require('sitemap2array');

const urls = await sitemap2array('https://example.com/sitemap.xml');
console.log(urls);
```

## API

### sitemap2array(url)

Returns a `Promise<string[]>` that resolves with an array of URLs from the sitemap.

- **url** — Full URL to a sitemap.xml file (must include `http://` or `https://`).
- Supports standard sitemaps (`<urlset>`) and sitemap indexes (`<sitemapindex>`).
- Throws on invalid URL, non-string input, or fetch/parse errors.

## Requirements

Node.js >= 18 (uses native `fetch`).

## License

MIT
