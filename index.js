'use strict';

const xmlParser = require('xml-parser');

const SITEMAP_URL_PATTERN = /sitemap.*\.xml/;

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

  return parsed.root.children
    .map(node => {
      const loc = node.children && node.children.find(child => child.name === 'loc');
      return loc ? loc.content : null;
    })
    .filter(Boolean);
}

module.exports = async function sitemap2array(url) {
  if (typeof url !== 'string') {
    throw new TypeError('URL parameter must be a string');
  }

  if (!validateUrl(url)) {
    throw new Error('URL parameter is not a valid sitemap.xml URL');
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  return parseSitemapXml(body);
};

module.exports.validateUrl = validateUrl;
module.exports.parseSitemapXml = parseSitemapXml;
