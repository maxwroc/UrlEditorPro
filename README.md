[![Build Status](https://travis-ci.org/maxwroc/UrlEditorPro.svg?branch=master)](https://travis-ci.org/maxwroc/UrlEditorPro)
[![Chrome store version](https://img.shields.io/chrome-web-store/v/maoigfcibanjdgnepaiiadjhgmejclea.svg)](https://chrome.google.com/webstore/detail/url-editor-pro/maoigfcibanjdgnepaiiadjhgmejclea)
![Chrome Web Store users](https://img.shields.io/chrome-web-store/users/maoigfcibanjdgnepaiiadjhgmejclea?color=yellow)

# UrlEditor PRO - Browser extension

This extension can help you with changing parameters (or parts) of complex and long urls.

## Main features:
* Simple UI
* Full keyboard support: keyboard shortcuts for all basic operations (no need to use mouse)
* Auto-complete / auto-suggest - suggests you recently used params on particular page or values for it
* Auto-refresh - reloads current page with given interval
* Configurable

![Extension main popup window screenshot](https://github.com/maxwroc/UrlEditorPro/blob/master/UrlEditorPRO/screenshots/screenshot.png)

## Auto-complete / auto-suggest
![Auto-complete screenshot](https://github.com/maxwroc/UrlEditorPro/blob/master/UrlEditorPRO/screenshots/screenshot_autosuggest.png)

## Options page
![Options page screenshot](https://github.com/maxwroc/UrlEditorPro/blob/master/UrlEditorPRO/screenshots/options.png)


## Dev
### How to start?
* Instal [NPM]( https://www.npmjs.com/)
* `npm install`

Recommended IDE: VSCode

### Working with the code
* Build: `gulp build`
* Build tests: `gulp build-test`
* Build and run tests: `gulp test`
* Full build and run tests: `gulp test-ci`
* Full build and run tests in deug mode: `gulp test-ci-debug`
* Watch app (rebuild on save): `gulp watch`
* Watch tests (rebuild on save): `gulp watch-test`
