// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
declare var chrome;


// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.getSelected(null, function (tab) {
        var content = <HTMLTextAreaElement>document.getElementById("full_url");
        content.value = JSON.stringify(UrlParser.parseUrl(tab.url));
    });
});