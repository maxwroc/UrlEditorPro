/// <reference path="modules/settings.ts" />
/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/redirection.ts" />
/// <reference path="modules/helpers.ts" />
/// <reference path="modules/tracking.ts" />
/// <reference path="../../typings/index.d.ts" />

module UrlEditor {

    class Background {
        private beforeRequestListeners = [];
        private redirMgr: RedirectionManager;
        private contextMenuItems: chrome.contextMenus.CreateProperties[] = [];

        constructor(private settings = new Settings(localStorage)) {
            Tracking.init(this.settings.trackingEnabled, "/background.html", false/*logEventsOnce*/);
        }

        public handleKeyboardCommand(command: string) {
            switch (command) {
                case Command.GoToHomepage:
                    Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "homepage");
                    chrome.tabs.getSelected(null, function (tab) {
                        let uri = new UrlEditor.Uri(tab.url);
                        chrome.tabs.update(tab.id, { url: uri.protocol() + "//" + uri.host() });
                    });
                    break;
                case Command.RedirectUseFirstRule:
                    Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "first_rule");
                    this.contextMenuItems[0] && this.contextMenuItems[0].onclick(null, null);
                    break;

            }
        }

        public handleMessage(msg: string) {
            switch (msg) {
                case Command.ReloadRedirectionRules:
                    // remove old listeners
                    this.beforeRequestListeners.forEach(l => chrome.webRequest.onBeforeRequest.removeListener(l));
                    this.beforeRequestListeners = [];
                    // re-initialize
                    this.initializeRedirections();
                    break;
            }
        }

        public initializeRedirections() {
            this.settings = new Settings(localStorage);
            this.redirMgr = new RedirectionManager(this.settings);

            this.redirMgr.initOnBeforeRequest((urlFilter, name, handler, infoSpec) => {
                // create new wrapper and add it to the list (we need to do it to be able to remove listener later)
                this.beforeRequestListeners.push(r => {
                    let result = handler(r);
                    if (result && result.redirectUrl) {
                        Tracking.trackEvent(Tracking.Category.Redirect, "automatic");
                    }

                    return result;
                });
                chrome.webRequest.onBeforeRequest.addListener(this.beforeRequestListeners[this.beforeRequestListeners.length -1], { urls: [urlFilter] }, infoSpec);
            });
        }

        public initializeContextMenu(tabId: number) {
            this.contextMenuItems = [];
            chrome.contextMenus.removeAll();

            chrome.tabs.get(tabId, tab => {
                let data = this.redirMgr.getData();

                Object.keys(data).forEach(name => {
                    let rule = new RedirectRule(data[name]);

                    // skip all autromatic rules and ones which are not for the current url
                    if (!rule.isAutomatic && rule.isUrlSupported(tab.url)) {

                        this.contextMenuItems.push({
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

                        chrome.contextMenus.create(this.contextMenuItems[this.contextMenuItems.length - 1]);
                    }
                })
            });
        }
    }

    const bg = new Background();

    chrome.commands.onCommand.addListener(cmd => bg.handleKeyboardCommand(cmd));
    chrome.runtime.onMessage.addListener(msg => bg.handleMessage(msg));
    chrome.tabs.onActivated.addListener(activeInfo => bg.initializeContextMenu(activeInfo.tabId));
    chrome.tabs.onUpdated.addListener((tabId, changedInfo) => changedInfo.url && bg.initializeContextMenu(tabId));

    bg.initializeRedirections();
}
