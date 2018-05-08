/// <reference path="modules/settings.ts" />
/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/redirection.ts" />
/// <reference path="modules/helpers.ts" />
/// <reference path="modules/tracking.ts" />
/// <reference path="../../typings/index.d.ts" />
/// <reference path="shared/interfaces.shared.d.ts" />

module UrlEditor {

    class Background implements IPageBackground {
        private beforeRequestListeners = [];
        private redirMgr: RedirectionManager;
        private contextMenuItems: chrome.contextMenus.CreateProperties[] = [];

        constructor(private settings = new Settings(localStorage)) {
            let version = chrome.runtime.getManifest().version;

            // it is better to set variable before page view event (init)
            Tracking.setCustomDimension(Tracking.Dimension.Version, version);
            Tracking.init(this.settings.trackingEnabled, "/background.html", false/*logEventsOnce*/, version);
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

        private eventListeners: IMap<Function[]> = {};
        private contextMenus: IMap<IMap<IMap<ContextMenuProperties>>> = {};

        private initializeContextMenu2() {
            chrome.contextMenus.removeAll();

            let allTabsContextMenus = this.contextMenus["-1"];

            chrome.tabs.getCurrent(tab => {
                let currentTabId = tab.id;
                let processedGroups = {};

                let tabContextMenus = this.contextMenus[currentTabId];
                // add menu items for current tab
                if (tabContextMenus) {
                    Object.keys(tabContextMenus).forEach(group => {
                        Object.keys(this.contextMenus[currentTabId][group]).forEach(label => {
                            this.addEnabledContextMenuItem(tab, tabContextMenus[group][label])
                        });

                        // to keep groups together we add items from "all tabs"
                        if (allTabsContextMenus && allTabsContextMenus[group]) {
                            Object.keys(allTabsContextMenus[group]).forEach(label => {
                                this.addEnabledContextMenuItem(tab, allTabsContextMenus[group][label]);
                            });
                        }
                    });
                }

                // adding "all tabs" manu items
                if (allTabsContextMenus) {
                    Object.keys(allTabsContextMenus).forEach(group => {
                        Object.keys(allTabsContextMenus[group]).forEach(label => {
                            this.addEnabledContextMenuItem(tab, allTabsContextMenus[group][label]);
                        });
                    });
                }
            });
        }

        private addEnabledContextMenuItem(tab: chrome.tabs.Tab, item: ContextMenuProperties) {
            if (!item.isEnabled || item.isEnabled(tab)) {
                chrome.contextMenus.create(item);
            }
        }

        addEventListener<N extends "tabChange">(name: N, handler: IBackgroundPageEventMap[N]) {
            if (!this.eventListeners[name]) {
                this.eventListeners[name] = [];
            }

            this.eventListeners[name].push(handler);
        }

        addActionContextMenuItem(group: string, label: string, handler, tabId: number = -1, isEnabled?: Function) {
            if (!this.contextMenuItems[tabId]) {
                this.contextMenuItems[tabId] = {};
            }

            if (!this.contextMenuItems[tabId][group]) {
                this.contextMenuItems[tabId][group] = {};
            }

            if (this.contextMenuItems[tabId][group][label]) {
                throw new Error(`Context menu item exists already [${tabId}|${group}|${label}]`);
            }

            this.contextMenus[tabId][group][label] = {
                title: label,
                contexts: ["browser_action"],
                onclick: handler
            };

            this.initializeContextMenu2();
        }

        removeActionContextMenuItem(group: string, label: string, tabId: number = -1) {
            let tabContextMenu = this.contextMenuItems[tabId.toString()];
            if (!tabContextMenu ||
                !tabContextMenu[group] ||
                !tabContextMenu[group][label]) {
                // it looks like it is removed already
                return;
            }

            delete tabContextMenu[group][label];

            this.initializeContextMenu2();
        }
    }

    const settings = new Settings(localStorage)
    const bg = new Background(settings);

    chrome.commands.onCommand.addListener(cmd => bg.handleKeyboardCommand(cmd));
    chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => bg.handleMessage(msgData));
    chrome.tabs.onActivated.addListener(activeInfo => bg.initializeContextMenu(activeInfo.tabId));
    chrome.tabs.onUpdated.addListener((tabId, changedInfo) => changedInfo.url && bg.initializeContextMenu(tabId));

    bg.initializeRedirections();

    Plugins.Background.forEach(plugin => plugin(settings, bg));

    interface ContextMenuProperties extends chrome.contextMenus.CreateProperties {
        isEnabled?: (tab: chrome.tabs.Tab) => boolean
    }
}
