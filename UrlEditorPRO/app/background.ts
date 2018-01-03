/// <reference path="modules/settings.ts" />
/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/redirection.ts" />
/// <reference path="modules/helpers.ts" />
/// <reference path="modules/tracking.ts" />
/// <reference path="../../typings/index.d.ts" />

module UrlEditor {
    const setts = new Settings(localStorage);
    Tracking.init(setts.trackingEnabled, "/background.html", false/*logEventsOnce*/);

    chrome.commands.onCommand.addListener(command => {
        switch (command) {
            case Command.GoToHomepage:
                Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "homepage");
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
            // create new wrapper and add it to the list (we need to do it to be able to remove listener later)
            beforeRequestListeners.push(r => {
                let result = handler(r);
                if (result && result.redirectUrl) {
                    Tracking.trackEvent(Tracking.Category.Redirect, "automatic");
                }

                return result;
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
                                Tracking.trackEvent(Tracking.Category.Redirect, "click", "context_menu");
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
