/// <reference path="modules/url_parser.ts" />
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
                beforeRequestListeners.forEach(l => chrome.webRequest.onBeforeRedirect.removeListener(l));
                beforeRequestListeners = [];
                // re-initialize
                initializeRedirections();
                break;
        }
    })

    // clearing context menu
    //chrome.webRequest.onBeforeRequest.addListener(() => chrome.contextMenus.removeAll(), { urls: ["*"] });

    let beforeRequestListeners = [];
    function initializeRedirections() {
        let redirect = new RedirectionManager(new Settings(localStorage));

        redirect.initOnBeforeRequest((urlFilter, name, handler, infoSpec) => {
            beforeRequestListeners.push(r => {
                return handler(r, false);
                /*
                chrome.contextMenus.create({
                    title: "Redirect: " + name,
                    contexts: ["browser_action"],
                    onclick: () => handler(r, true)
                });
                */
            });
            chrome.webRequest.onBeforeRequest.addListener(beforeRequestListeners[beforeRequestListeners.length -1], { urls: [urlFilter] }, infoSpec);
        });
    }

    initializeRedirections();
}
