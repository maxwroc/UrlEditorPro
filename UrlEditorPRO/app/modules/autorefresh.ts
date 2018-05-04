
/// <reference path="../shared/interfaces.shared.d.ts" />

module UrlEditor {

    const Command = "AutoRefresh";

    export class Refresh {
        private tabRefreshMap: IMap<number> = {};

        constructor(settings: Settings, background: IPageBackground) {
            background.registerCommandHandler(Command, (tabId: number, interval: number) => this.onCommandReceived(tabId, interval));
            background.addEventListener("tabChange", () => this.onTabChange())
        }

        private onCommandReceived(tabId: number, interval: number) {
            if (interval == 0) {
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId]);
                delete this.tabRefreshMap[tabId];
            }
            else {
                // clear previous if exists
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId]);
                this.tabRefreshMap[tabId] = setInterval(() => this.refreshTab(tabId), interval);

                chrome.browserAction.setBadgeText({ tabId: tabId, text: "R" });
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "green" });
            }
        }

        private onTabChange() {
            // check if all auto-refreshing tabs still exist
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

    export class RefreshViewModel {

    }

}