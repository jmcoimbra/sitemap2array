'use strict';

const xmlParser = require('xml-parser');

const SITEMAP_URL_PATTERN = /sitemap.*\.xml/;
const MAX_DEPTH = 3;

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) &&
      SITEMAP_URL_PATTERN.test(parsed.pathname);
  } catch {
    return false;
  }
}

function parseSitemapXml(xml) {
  const parsed = xmlParser(xml);

  if (!parsed.root || !parsed.root.children) {
    throw new Error('Invalid sitemap XML: missing root element or children');
  }

  const isSitemapIndex = parsed.root.name === 'sitemapindex';

  const urls = parsed.root.children
    .map(node => {
      const loc = node.children && node.children.find(child => child.name === 'loc');
      return loc ? loc.content : null;
    })
    .filter(Boolean);

  return { urls, isSitemapIndex };
}

async function fetchSitemap(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function resolveSitemap(url, depth) {
  const body = await fetchSitemap(url);
  const { urls, isSitemapIndex } = parseSitemapXml(body);

  if (!isSitemapIndex) {
    return urls;
  }

  if (depth >= MAX_DEPTH) {
    throw new Error(`Sitemap index recursion exceeded max depth of ${MAX_DEPTH}`);
  }

  const results = await Promise.all(
    urls.map(childUrl => resolveSitemap(childUrl, depth + 1))
  );

  return results.flat();
}

module.exports = async function sitemap2array(url, options) {
  if (typeof url !== 'string') {
    throw new TypeError('URL parameter must be a string');
  }

  if (!validateUrl(url)) {
    throw new Error('URL parameter is not a valid sitemap.xml URL');
  }

  const followIndex = options && options.followIndex === false ? false : true;

  const body = await fetchSitemap(url);
  const { urls, isSitemapIndex } = parseSitemapXml(body);

  if (!isSitemapIndex || !followIndex) {
    return urls;
  }

  const results = await Promise.all(
    urls.map(childUrl => resolveSitemap(childUrl, 1))
  );

  return results.flat();
};

module.exports.validateUrl = validateUrl;
module.exports.parseSitemapXml = parseSitemapXml;
