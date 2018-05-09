
/// <reference path="../shared/interfaces.shared.d.ts" />
/// <reference path="../shared/shared.ts" />

module UrlEditor {

    const MessageType = "AutoRefresh";
    const DefaultMenuItem = "Refresh this page every 30s";
    const StopRefreshingLabel = "Stop refreshing";

    interface IRefreshData {
        lastRefresh: number;
        intervalHandle: number;
        interval: number;
    }

    function getCurrentTab(callback: (tab: chrome.tabs.Tab) => void) {
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
            if (tabs.length != 1) {
                tabs.length > 1 && console.error("AutoRefresh: Invalid number of active tabs");
                return;
            }

            callback(tabs[0]);
        });
    }

    export class RefreshBackgroundProcessor {
        private tabRefreshMap: IMap<IRefreshData> = {};
        private counterInterval: number;

        private counterEnabled: boolean = true;

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
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId].intervalHandle);
                delete this.tabRefreshMap[tabId];
                this.background.removeActionContextMenuItem(MessageType, StopRefreshingLabel);
                this.addDefaultContextMenuItem();

                if (Object.keys(this.tabRefreshMap).length == 1) {
                    clearInterval(this.counterInterval);
                    this.counterInterval = null;
                    chrome.browserAction.setBadgeText({ text: "", tabId: tabId });
                }
            }
            else {
                // clear previous if exists
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId].intervalHandle);
                this.tabRefreshMap[tabId] = {
                    intervalHandle: setInterval(() => this.refreshTab(tabId), interval * 1000),
                    interval: interval,
                    lastRefresh: Date.now()
                }

                this.background.removeActionContextMenuItem(MessageType, DefaultMenuItem);
                // TODO get tabId for setRefreshIntervalForTab from tab.query
                this.background.addActionContextMenuItem(MessageType, StopRefreshingLabel, () => this.setRefreshIntervalForTab(tabId, 0), tabId);

                if (this.counterEnabled) {
                    if (!this.counterInterval) {
                        this.counterInterval = setInterval(() => this.updateCounter(), 1000);
                    }
                }
                else {
                    this.setBadgeText(tabId);
                }
            }
        }

        private setBadgeText(tabId: number, text: string = "R") {
            // set badge if text is not static one or when counter is disabled
            if (text != "R" || !this.counterEnabled) {
                chrome.browserAction.setBadgeText({ tabId: tabId, text: text });
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "green" });
            }
        }

        private updateCounter() {
            getCurrentTab(tab => {
                let refreshData = this.tabRefreshMap[tab.id];
                if (refreshData) {
                    let remainingSecs = refreshData.interval - Math.floor((Date.now() - refreshData.lastRefresh) / 1000);
                    console.log("remainingSecs: " + remainingSecs);
                    this.setBadgeText(tab.id, this.getHumanReadableTime(remainingSecs));
                }
            });
        }

        private getHumanReadableTime(secs: number) {
            const timeUnits = ["s", "m", "h", "d"];
            const timeValues = [60, 60, 24];

            let scale = 0;
            while (scale < timeValues.length && secs > timeValues[scale]) {
                secs = Math.floor(secs / timeValues[scale]);
                scale++;
            }

            return secs + timeUnits[scale];
        }

        private refreshTab(tabId: number) {
            // get current tab - refresh only if matches? setting?
            getCurrentTab(tab => {
                if (tab && tab.id == tabId) {
                    chrome.tabs.reload(tabId);
                    this.setBadgeText(tabId);
                    this.tabRefreshMap[tabId].lastRefresh = Date.now();
                }
            });
        }
    }

    export class RefreshViewModel implements Plugins.IPlugin {
        private static TimePattern = /([0-9]+)(s|m|h|d)?/i

        constructor(settings: Settings, viewModel: IViewModel) {
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

            getCurrentTab(tab => {
                chrome.runtime.sendMessage({ type: MessageType, tabId: tab.id, interval: secs })
            });
        }
    }

    Plugins.ViewModel.push(RefreshViewModel);
    Plugins.Background.push(RefreshBackgroundProcessor);
}