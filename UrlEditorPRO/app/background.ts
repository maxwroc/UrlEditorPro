﻿/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/redirection.ts" />
/// <reference path="modules/helpers.ts" />
/// <reference path="../../typings/index.d.ts" />

module UrlEditor {
    chrome.commands.onCommand.addListener(command => {
        switch (command) {
            case Command.GoToHomepage:
                chrome.tabs.getSelected(null, function (tab) {
                    let uri = new UrlEditor.Uri(tab.url);
                    chrome.tabs.update(tab.id, { url: uri.protocol() + "//" + uri.host() });
                });
                break;
        }
    });

    chrome.runtime.onMessage.addListener(msg => {
        switch (msg) {
            case Command.ReloadRedirectionRules:
                // remove old listeners
                beforeRequestListeners.forEach(l => chrome.webRequest.onBeforeRequest.removeListener(l));
                beforeRequestListeners = [];
                // re-initialize
                initializeRedirections();
                break;
        }
    })

    let beforeRequestListeners = [];
    function initializeRedirections() {
        let redirect = new RedirectionManager(new Settings(window.localStorage));

        redirect.initOnBeforeRequest((urlFilter, name, handler, infoSpec) => {
            beforeRequestListeners.push(r => {
                return handler(r, false);
            });
            chrome.webRequest.onBeforeRequest.addListener(beforeRequestListeners[beforeRequestListeners.length -1], { urls: [urlFilter] }, infoSpec);
        });
    }

    function initializeContextMenu(tabId: number) {
        chrome.contextMenus.removeAll();

        chrome.tabs.get(tabId, tab => {
            let redirect = new RedirectionManager(new Settings(localStorage));
            let data = redirect.getData();

            Object.keys(data).forEach(name => {
                let rule = new RedirectRule(data[name]);

                // skip all autromatic rules and ones which are not for the current url
                if (!rule.isAutomatic && rule.isUrlSupported(tab.url)) {
                    chrome.contextMenus.create({
                        title: "Redirect: " + name,
                        contexts: ["browser_action"],
                        onclick: () => {
                            let newUrl = rule.getUpdatedUrl(tab.url);
                            if (tab.url != newUrl) {
                                chrome.tabs.update(tab.id, { url: newUrl });
                            }
                        }
                    });
                }
            })
        });
    }

    chrome.tabs.onActivated.addListener(activeInfo => initializeContextMenu(activeInfo.tabId));
    chrome.tabs.onUpdated.addListener((tabId, changedInfo) => {
        // check if url of the current tab has changed
        if (changedInfo.url) {
            initializeContextMenu(tabId);
        }
    });

    initializeRedirections();
}
