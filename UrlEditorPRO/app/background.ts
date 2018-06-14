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

        private eventListeners: IMap<Function[]> = {};
        private contextMenus: IMap<IMap<IMap<ContextMenuProperties>>> = {};

        private delayedUiUpdate: number;
        private currentTabId: number;

        constructor(private settings = new Settings(localStorage)) {
            let version = chrome.runtime.getManifest().version;

            // it is better to set variable before page view event (init)
            Tracking.setCustomDimension(Tracking.Dimension.Version, version);
            Tracking.init(this.settings.trackingEnabled, "/background.html", false/*logEventsOnce*/, version);

            // Refresh context menu when user switches tabs
            this.addEventListener("tabChange", () => this.initializeContextMenu());
            // Refresh context menu on navigate action
            this.addEventListener("tabNavigate", () => this.initializeContextMenu());

            chrome.commands.onCommand.addListener(cmd => this.handleKeyboardCommand(cmd));
            chrome.tabs.onActivated.addListener(activeInfo => this.triggerEvent("tabChange", <any>activeInfo.tabId));
            chrome.tabs.onUpdated.addListener((tabId, changedInfo) => changedInfo.url && this.triggerEvent("tabNavigate", tabId, changedInfo.url));

            Plugins.Background.forEach(plugin => new plugin(settings, this));
        }

        /**
         * Adds event listener.
         * @param name Event name.
         * @param handler Evend callback function.
         */
        addEventListener<N extends keyof IBackgroundPageEventMap>(name: N, handler: IBackgroundPageEventMap[N]) {
            if (!this.eventListeners[name]) {
                this.eventListeners[name] = [];
            }

            this.eventListeners[name].push(handler);
        }

        /**
         * Registers new context menu item.
         * @param props Context menu item properties.
         */
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

        /**
         * Returns active/enabled action-contextmenu items.
         * @param tab Tab for which context menu items should be returned.
         * @param group Context menu items group.
         */
        getActiveActionContextMenuItems(tab: chrome.tabs.Tab, group: string): ContextMenuProperties[] {
            if (!this.contextMenus[tab.id] || !this.contextMenus[group]) {
                return [];
            }

            let groupItems = this.contextMenus[tab.id][group];

            return Object.keys(groupItems)
                .map(label => groupItems[label].isEnabled(tab) ? groupItems[label] : null)
                .filter(val => val !== null);
        }

        /**
         * Unregisters context menu item or group.
         * @param group Context menu item group.
         * @param label Context menu item label.
         * @param tabId Context menu item tab id.
         */
        removeActionContextMenuItem(group: string, label: string = null, tabId: number = -1) {
            let tabContextMenu = this.contextMenus[tabId.toString()];
            if (!tabContextMenu ||
                !tabContextMenu[group]) {
                // it looks like it is removed already
                return;
            }

            if (label == null) {
                // remove entire group
                delete tabContextMenu[group];
            }
            else if (tabContextMenu[group][label]) {
                delete tabContextMenu[group][label];
            }

            this.throttledContextMenuInit();
        }

        /**
         * Handle keyboard commands / shortcuts.
         * @param command Command type.
         */
        private handleKeyboardCommand(command: string) {
            switch (command) {
                case Command.GoToHomepage:
                    Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "homepage");
                    Helpers.getActiveTab(tab => {
                        let uri = new UrlEditor.Uri(tab.url);
                        chrome.tabs.update(tab.id, { url: uri.protocol() + "//" + uri.host() });
                    });
                    break;
            }
        }

        /**
         * To avoid upating context menu every time when menu item is being added/removed
         * we delay execution by releasing thread.
         */
        private throttledContextMenuInit() {
            clearTimeout(this.delayedUiUpdate);
            this.delayedUiUpdate = setTimeout(() => this.initializeContextMenu(), 0);
        }

        /**
         * Initializes/updates registered context menu items.
         */
        private initializeContextMenu() {
            this.clearContextMenu();
            let allTabsContextMenus = this.contextMenus["-1"];

            Helpers.getActiveTab(tab => {
                if (tab.id < 0) {
                    // Developers toolbar is being returned as -1
                    return;
                }

                // remove old items again to be sure nothing was added meanwhile
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

        /**
         * Removes all current context menu items.
         *
         * In addition make sure that all registered context menu items are clean and ready
         * to render (removes properties added when the item is rendered).
         */
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

        /**
         * Conditionally adds context menu item.
         *
         * Iteam is added only if isEnabled method is not defined or when it returns true.
         * @param tab Current tab.
         * @param item Context menu item properties.
         */
        private addEnabledContextMenuItem(tab: chrome.tabs.Tab, item: ContextMenuProperties) {
            if (!item.isEnabled || item.isEnabled(tab)) {
                let cloned = Object.assign({}, item);
                delete cloned["isEnabled"];
                chrome.contextMenus.create(cloned);
            }
        }

        /**
         * Triggers event causing all the particular event handlers to be called.
         * @param name Event name.
         * @param args Event arguments.
         */
        private triggerEvent<N extends keyof IBackgroundPageEventMap>(name: N, ...args: any[]) {
            if (this.eventListeners[name]) {
                let eventHandlerArgs = [];
                switch (name) {
                    case "tabChange":
                        {
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
                        }
                        break;
                    case "tabNavigate":
                        {
                            let tabId = <number><any>args[0];
                            let url = <string><any>args[1];
                            this.eventListeners[name].forEach(h => {
                                Helpers.safeExecute(() => {
                                    let handler = <IBackgroundPageEventMap["tabNavigate"]>h;
                                    handler(tabId, url);
                                }, "tabNavigate handler");
                            });
                        }
                        break;
                }
            }
        }
    }

    const bg = new Background(new Settings(localStorage));
}
