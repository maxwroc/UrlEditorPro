// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
declare var chrome;


// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.getSelected(null, function (tab) {
        var content = <HTMLTextAreaElement>document.getElementById("full_url");
        var url = new UrlParser.Uri(tab.url);
        content.value = url.url();

        (<HTMLInputElement>document.getElementById("path")).value = url.pathname();

        var params = document.getElementById("params");
        var urlParams = url.params();
        for (var name in urlParams) {
            var param = <HTMLDivElement>document.createElement("div");
            param.className = "param";
            param.innerHTML = '<input type="text" /> <input type="text" class="value" /> <input type="checkbox" /> <input type="button" value="x" />';

            var paramNameElem = <HTMLInputElement>param.firstElementChild;
            paramNameElem.value = name;

            var paramValue = <HTMLInputElement>paramNameElem.nextElementSibling;
            paramValue.value = urlParams[name];

            params.appendChild(param);
        }
    });
});