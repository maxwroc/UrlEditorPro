/// <reference path="modules/settings.ts" />
/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/redirection.ts" />
/// <reference path="modules/helpers.ts" />
/// <reference path="modules/tracking.ts" />
/// <reference path="../../typings/index.d.ts" />
/// <reference path="shared/interfaces.shared.d.ts" />
/// <reference path="shared/shared.ts" />

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

            this.addEventListener("tabChange", () => this.initializeContextMenu2());
        }

        public handleKeyboardCommand(command: string) {
            switch (command) {
                case Command.GoToHomepage:
                    Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "homepage");
                    this.getSelectedTab(tab => {
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

        private delayedUiUpdate: number;
        private currentTabId: number;

        /**
         * To avoid upating context menu every time when menu item is being added/removed we delay execution by releasing thread
         */
        private throttledContextMenuInit() {
            clearTimeout(this.delayedUiUpdate);
            this.delayedUiUpdate = setTimeout(() => this.initializeContextMenu2(), 0);
        }

        private initializeContextMenu2() {
            this.clearContextMenu();
            let allTabsContextMenus = this.contextMenus["-1"];

            this.getSelectedTab(tab => {
                if (tab.id < 0) {
                    // Developers toolbar is being returned as -1
                    return;
                }

                this.clearContextMenu();

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
                            processedGroups[group] = 1;
                            Object.keys(allTabsContextMenus[group]).forEach(label => {
                                this.addEnabledContextMenuItem(tab, allTabsContextMenus[group][label]);
                            });
                        }
                    });
                }

                // adding "all tabs" manu items
                if (allTabsContextMenus) {
                    Object.keys(allTabsContextMenus).forEach(group => {
                        if (!processedGroups[group]) {
                            Object.keys(allTabsContextMenus[group]).forEach(label => {
                                this.addEnabledContextMenuItem(tab, allTabsContextMenus[group][label]);
                            });
                        }
                    });
                }
            });
        }

        private getSelectedTab(callback: (tab: chrome.tabs.Tab) => void) {
            chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
                if (tabs.length != 1) {
                    tabs.length > 1 && console.error("Invalid number of active tabs");
                    return;
                }

                let tab = tabs[0];

                if (tab.id < 0) {
                    // Developers toolbar is being returned as -1
                    return;
                }

                callback(tab);
            });
        }

        private clearContextMenu() {
            chrome.contextMenus.removeAll();
            Object.keys(this.contextMenus).forEach(tab => {
                let allTabsContextMenus = this.contextMenus[tab];
                Object.keys(allTabsContextMenus).forEach(group => {
                    Object.keys(allTabsContextMenus[group]).forEach(label => {
                        delete allTabsContextMenus[group][label]["generatedId"];
                    });
                });
            });
        }

        private addEnabledContextMenuItem(tab: chrome.tabs.Tab, item: ContextMenuProperties) {
            if (!item.isEnabled || item.isEnabled(tab)) {
                let cloned = Object.assign({}, item);
                delete cloned["isEnabled"];
                chrome.contextMenus.create(cloned);
            }
        }

        addEventListener<N extends keyof IBackgroundPageEventMap>(name: N, handler: IBackgroundPageEventMap[N]) {
            if (!this.eventListeners[name]) {
                this.eventListeners[name] = [];
            }

            this.eventListeners[name].push(handler);
        }

        triggerEvent<N extends keyof IBackgroundPageEventMap>(name: N, ...args: object[]) {
            if (this.eventListeners[name]) {
                let eventHandlerArgs = [];
                switch (name) {
                    case "tabChange":
                        let tabId = <number><any>args[0];
                        // trigger only if actually has changed
                        if (this.currentTabId != tabId) {
                            this.currentTabId = tabId;

                            this.eventListeners[name].forEach(h => {
                                Helpers.safeExecute(() => {
                                    let handler = <IBackgroundPageEventMap["tabChange"]>h;
                                    handler(tabId);
                                }, "tabChange handler");
                            });
                        }
                        break;
                }
            }
        }

        addActionContextMenuItem(props: IContextMenuItemProperties) {
            let tabId = (props.tabId || -1).toString();

            if (!this.contextMenus[tabId]) {
                this.contextMenus[tabId] = {};
            }

            if (!this.contextMenus[tabId][props.group]) {
                this.contextMenus[tabId][props.group] = {};
            }

            if (this.contextMenus[tabId][props.group][props.label]) {
                throw new Error(`Context menu item exists already [${tabId}|${props.group}|${props.label}]`);
            }

            this.contextMenus[tabId][props.group][props.label] = {
                title: props.label,
                contexts: ["browser_action"],
                onclick: props.clickHandler,
                isEnabled: (tab) => !props.isEnabled || props.isEnabled(tab)
            };

            this.throttledContextMenuInit();
        }

        removeActionContextMenuItem(group: string, label: string, tabId: number = -1) {
            let tabContextMenu = this.contextMenus[tabId.toString()];
            if (!tabContextMenu ||
                !tabContextMenu[group] ||
                !tabContextMenu[group][label]) {
                // it looks like it is removed already
                return;
            }

            delete tabContextMenu[group][label];

            this.throttledContextMenuInit();
        }
    }

    const settings = new Settings(localStorage)
    const bg = new Background(settings);

    chrome.commands.onCommand.addListener(cmd => bg.handleKeyboardCommand(cmd));
    chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => bg.handleMessage(msgData));
    //chrome.tabs.onActivated.addListener(activeInfo => bg.initializeContextMenu(activeInfo.tabId));
    //chrome.tabs.onUpdated.addListener((tabId, changedInfo) => changedInfo.url && bg.initializeContextMenu(tabId));
    chrome.tabs.onActivated.addListener(activeInfo => bg.triggerEvent("tabChange", <any>activeInfo.tabId));

    bg.initializeRedirections();

    Plugins.Background.forEach(plugin => new plugin(settings, bg));

    interface ContextMenuProperties extends chrome.contextMenus.CreateProperties {
        isEnabled?: (tab: chrome.tabs.Tab) => boolean
    }

    function forEachKey(obj: object, callback: (key: string, item: any) => void) {

    }
}
