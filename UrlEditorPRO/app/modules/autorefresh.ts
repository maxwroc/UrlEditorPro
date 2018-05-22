/// <reference path="../shared/interfaces.shared.d.ts" />
/// <reference path="../shared/shared.ts" />

module UrlEditor {

    const AutoRefreshType = "AutoRefresh";
    const RefreshPageEveryXLabel = "Refresh this page every 30s";
    const StopRefreshingLabel = "Stop refreshing";

    /**
     * Stores refresh info/details
     */
    interface IRefreshData {
        lastRefresh: number;
        intervalHandle: number;
        interval: number;
    }

    /**
     * Gets currently active tab
     * @param callback Result callback
     */
    function getCurrentTab(callback: (tab: chrome.tabs.Tab) => void) {
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
            if (tabs.length != 1) {
                tabs.length > 1 && console.error("AutoRefresh: Invalid number of active tabs");
                return;
            }

            callback(tabs[0]);
        });
    }

    /**
     * Contains logic responsible for triggering reloads/refresh
     */
    export class RefreshBackgroundProcessor {
        private tabRefreshMap: IMap<IRefreshData> = {};
        private counterInterval: number;

        private counterEnabled: boolean = true;

        constructor(settings: Settings, private background: IPageBackground) {
            // add default "Refresh every ..."
            this.addDefaultContextMenuItem();

            // listening for messages from view model
            chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => {
                if (msgData.type != AutoRefreshType) {
                    return;
                }

                switch (msgData.command) {
                    case "setInterval":
                        if (msgData.interval === undefined) {
                            throw new Error("AutoRefresh: interval missing in message data");
                        }

                        if (msgData.tabId === undefined) {
                            throw new Error("AutoRefresh: tabId missing in message data");
                        }

                        this.setRefreshIntervalForTab(msgData.tabId, msgData.interval);
                        break;
                    case "getCurrentTabRefreshData":
                        getCurrentTab(tab => sendResponse(this.tabRefreshMap[tab.id]));
                        break;
                }
            })
        }

        /**
         * Adds "Refresh every..." context menu item
         */
        private addDefaultContextMenuItem() {
            this.background.addActionContextMenuItem({
                group: AutoRefreshType,
                label: RefreshPageEveryXLabel,
                clickHandler: (info, tab) => { this.setRefreshIntervalForTab(tab.id, 30) },
                isEnabled: tab => !this.tabRefreshMap[tab.id]
            });
        }

        /**
         * Sets refresh interval for given tab
         * @param tabId Tab id
         * @param interval Interval value in seconds
         */
        private setRefreshIntervalForTab(tabId: number, interval: number) {
            // check if we should disable refresh
            if (interval == 0) {
                // cleaning up
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId].intervalHandle);
                delete this.tabRefreshMap[tabId];
                this.background.removeActionContextMenuItem(AutoRefreshType, StopRefreshingLabel, tabId);
                chrome.browserAction.setBadgeText({ text: "", tabId: tabId });

                // clear counter interval (for updating badge) only if no other refresh is setup
                if (Object.keys(this.tabRefreshMap).length == 0) {
                    clearInterval(this.counterInterval);
                    this.counterInterval = null;
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

                // add menu item for stopping refreshing
                this.background.addActionContextMenuItem({
                    group: AutoRefreshType,
                    label: StopRefreshingLabel,
                    clickHandler: () => this.setRefreshIntervalForTab(tabId, 0),
                    tabId: tabId
                });

                if (this.counterEnabled) {
                    // we set one global counter for all the active tabs which are refreshing
                    if (!this.counterInterval) {
                        this.counterInterval = setInterval(() => this.updateCounter(), 1000);
                    }
                }
                else {
                    // set static badge "R"
                    this.setBadgeText(tabId);
                }
            }
        }

        /**
         * Sets badge text
         * @param tabId Tab id
         * @param text Badge text (default "R")
         */
        private setBadgeText(tabId: number, text: string = "R") {
            // set badge if text is not static one or when counter is disabled
            if (text != "R" || !this.counterEnabled) {
                chrome.browserAction.setBadgeText({ tabId: tabId, text: text });
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "green" });
            }
        }

        /**
         * Updates badge counter
         */
        private updateCounter() {
            getCurrentTab(tab => {
                let refreshData = this.tabRefreshMap[tab.id];
                // check if we are refreshing current tab
                if (refreshData) {
                    let remainingSecs = refreshData.interval - Math.floor((Date.now() - refreshData.lastRefresh) / 1000);
                    this.setBadgeText(tab.id, this.getHumanReadableTime(remainingSecs));
                }
            });
        }

        /**
         * Converts seconds to shorter format (with units)
         * @param secs Seconds to convert
         */
        private getHumanReadableTime(secs: number) {
            const timeUnits = ["s", "m", "h", "d"];
            const timeValues = [60, 60, 24];

            let unit = 0;
            while (unit < timeValues.length && secs > timeValues[unit]) {
                secs = Math.floor(secs / timeValues[unit]);
                unit++;
            }

            return secs + timeUnits[unit];
        }

        /**
         * Refreshes/reloads tab.
         * @param tabId Tab id
         */
        private refreshTab(tabId: number) {
            this.tabRefreshMap[tabId].lastRefresh = Date.now();
            // get current tab - refresh only if matches? setting?
            getCurrentTab(tab => {
                if (tab && tab.id == tabId) {
                    chrome.tabs.reload(tabId);
                    this.setBadgeText(tabId);
                }
            });
        }
    }

    /**
     * Contains logic related to plugin UI
     */
    export class RefreshViewModel implements Plugins.IPlugin {
        private static TimePattern = /([0-9]+)(s|m|h|d)?/i

        constructor(settings: Settings, viewModel: IViewModel) {
            let button = Helpers.ge<HTMLInputElement>("set_refresh_interval");
            let valueTextBox = (<HTMLInputElement>button.previousElementSibling);
            button.addEventListener("click", () => {
                this.setRefreshInterval(valueTextBox.value);
                this.hideOptionsModule();
            });

            // set button text
            chrome.runtime.sendMessage({ type: AutoRefreshType, command: "getCurrentTabRefreshData" }, (data: IRefreshData) => {
                if (data) {
                    button.value = "Stop";
                    valueTextBox.value = data.interval + "s";
                }
            })
        }

        /**
         * Converts time value (e.g. 1m, 10h) to seconds and posts message to processor
         * @param val Time value
         */
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
                chrome.runtime.sendMessage({ type: AutoRefreshType, command: "setInterval", tabId: tab.id, interval: secs })
            });
        }

        private hideOptionsModule() {
            // hide page options module
            Helpers.ge<HTMLInputElement>("options_menu_check").checked = false;
            // show list of options
            Helpers.ge<HTMLInputElement>("options_list").checked = true;
        }
    }

    // register plugins
    Plugins.ViewModel.push(RefreshViewModel);
    Plugins.Background.push(RefreshBackgroundProcessor);
}