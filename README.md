# sitemap2array

A module to read a simple sitemap.xml file online and return the URLs as an Array.

## Install

```
$ npm install sitemap2array
```

## Usage

```js
const sitemap2array = require('sitemap2array');

// change "google.com/sitemap.xml" to the sitemap URL you want to fetch
sitemap2array('google.com/sitemap.xml')
	.then(response => {
		console.log(response);
	})
	.catch(error => {
		console.log(error);
	});

```
