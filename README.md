# sitemap2array

A module to read a simple sitemap.xml file online and return the URLs as an Array.

## Install

```
$ npm install sitemap-xml-to-array
```

## Usage

```js
const sitemap2array = require('sitemap2array');

sitemap2array('google.com/sitemap.xml')
	.then(response => {
		console.log(response);
	})
	.catch(error => {
		console.log(error);
	});

```
