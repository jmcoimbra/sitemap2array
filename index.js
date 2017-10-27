'use strict';

function validateUrl(url) {
  // from https://www.regexpal.com/94502, coz I am lazy
  const urlRegExp = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
  const sitemapRegExp = /sitemap.xml$/;
  return (urlRegExp.test(url) && sitemapRegExp.test(url));
}

function sitemapUrlsToArray(sitemap) {
  const xmlParser = require('xml-parser');
  const parsedXml = xmlParser(sitemap);
  const urls = parsedXml.root.children.map(function(url) {
    var loc = url.children.filter(function(item) {
      return item.name === 'loc';
    })[0];
    return loc.content;
  });
  return urls;
}

module.exports = function(url) {
  return new Promise(function (resolve, reject) {
    if (typeof url !== 'string') {
      return reject(new TypeError('URL parameter must be a string'));
    }
    const isUrlValid = validateUrl(url);
    if (!isUrlValid) {
      return reject(new Error('URL parameter is not valid to fetch a sitemap.xml'));
    }

    // Fetch sitemap.xml
    const got = require('got');
    got(url)
      .then(response => {
        return resolve(sitemapUrlsToArray(response.body));
      })
      .catch(error => {
        return reject(error);
      });
  });
}
