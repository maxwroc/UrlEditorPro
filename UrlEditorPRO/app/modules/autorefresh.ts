
/// <reference path="../shared/interfaces.shared.d.ts" />
/// <reference path="../shared/shared.ts" />

module UrlEditor {

    const MessageType = "AutoRefresh";
    const DefaultMenuItem = "Refresh this page every 30s";
    const StopRefreshingLabel = "Stop refreshing";

    export class RefreshBackgroundProcessor {
        private tabRefreshMap: IMap<number> = {};

        constructor(settings: Settings, private background: IPageBackground) {
            //background.registerMessageHandler(Command, (tabId: number, interval: number) => this.onCommandReceived(tabId, interval));
            this.addDefaultContextMenuItem();

            chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => {
                if (msgData.type != MessageType) {
                    return;
                }

                if (msgData.interval === undefined) {
                    throw new Error("AutoRefresh: interval missing in message data");
                }

                if (msgData.tabId === undefined) {
                    throw new Error("AutoRefresh: tabId missing in message data");
                }

                this.setRefreshIntervalForTab(msgData.tabId, msgData.interval);
            })
        }

        private addDefaultContextMenuItem() {
            this.background.addActionContextMenuItem(MessageType, DefaultMenuItem, (info, tab) => { this.setRefreshIntervalForTab(tab.id, 30) });
        }

        private setRefreshIntervalForTab(tabId: number, interval: number) {
            if (interval == 0) {
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId]);
                delete this.tabRefreshMap[tabId];
                this.background.removeActionContextMenuItem(MessageType, StopRefreshingLabel);
                this.addDefaultContextMenuItem();
            }
            else {
                // clear previous if exists
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId]);
                this.tabRefreshMap[tabId] = setInterval(() => this.refreshTab(tabId), interval);

                chrome.browserAction.setBadgeText({ tabId: tabId, text: "R" });
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "green" });
                this.background.removeActionContextMenuItem(MessageType, DefaultMenuItem);
                this.background.addActionContextMenuItem(MessageType, StopRefreshingLabel, () => { }, tabId);
            }
        }

        private refreshTab(tabId: number) {
            // get current tab - refresh only if matches? setting?
            chrome.tabs.getSelected(null, function (tab) {
                if (tab.id == tabId) {
                    chrome.tabs.reload(tabId);
                }
            });
        }
    }

    export class RefreshViewModel implements Plugins.IViewModelPlugin {
        private static TimePattern = /([0-9]+)(s|m|h|d)?/i

        constructor(zzz: string) {
            let button = Helpers.ge("set_refresh_interval");
            button.addEventListener("click", () => {
                this.setRefreshInterval((<HTMLInputElement>button.previousElementSibling).value);
            })
        }

        private setRefreshInterval(val: string) {
            // treat empty string as disable
            val = val || "0";

            let parsed = val.match(RefreshViewModel.TimePattern);
            if (!parsed) {
                // TODO: message about wrong format
                return;
            }

            let secs = parseInt(parsed[1]);
            switch (parsed[2]) {
                case "d":
                    secs *= 60 * 60 * 24;
                    break;
                case "h":
                    secs *= 60 * 60;
                    break;
                case "m":
                    secs *= 60;
                    break;
            }

            chrome.tabs.getCurrent(tab => {
                chrome.runtime.sendMessage({ type: MessageType, tabId: tab.id, interval: secs })
            });
        }
    }

    Plugins.ViewModel.push()

}