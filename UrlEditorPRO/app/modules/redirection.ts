///<reference path="../shared/shared.ts" />
///<reference path="settings.ts" />
///<reference path="url_parser.ts" />
///<reference path="regexp.replacer.ts" />

module UrlEditor {

    /**
     * TODO:
     * 1. Action icon indicator showing available redirections
     */

    let converters: { [name: string]: (val: string, arg: string) => string } = {};
    converters.leaveAsIs = val => val;
    converters.replaceWith = (val, arg) => {
        return arg;
    }
    converters.increment = (val, arg) => (parseInt(val) + parseInt(arg)).toString();
    converters.decrease = (val, arg) => (parseInt(val) - parseInt(arg)).toString();
    converters.urlEncode = (val) => encodeURIComponent(val);
    converters.urlDecode = (val) => Helpers.safeExecute(() => decodeURIComponent(val), "Redirection/converter-urlDecode");
    converters.base64Encode = (val) => Helpers.b64EncodeUnicode(val);
    converters.base64Decode = (val) => Helpers.b64DecodeUnicode(val);

    export class RedirectRule {
        public urlFilter: string;
        public isAutomatic: boolean;

        static converters = converters;

        constructor(private replaceData: IRuleData) {
            this.urlFilter = replaceData.urlFilter;
            this.isAutomatic = replaceData.isAutomatic;
        }

        isUrlSupported(url: string): boolean {
            let reg = new RegExp("^" + this.urlFilter.replace(/[*]/g, ".*") + "$");
            return reg.test(url);
        }

        getUpdatedUrl(url: string): string {
            return (<IRegExpRuleData>this.replaceData).regExp ?
                this.getUpdatedUrlAdvanced(url, this.replaceData as IRegExpRuleData) :
                this.getUpdatedUrlSimple(url, this.replaceData as IRedirectionRuleData);
        }

        private getUpdatedUrlAdvanced(url: string, data: IRegExpRuleData): string {
            //url = url.replace(new RegExp(data.regExp, "g"), data.replaceString);
            let r = new RegExpGroupReplacer(data.regExp, data.isRegExpGlobal);
            url = r.replace(
                url,
                (val, index) => {
                    try {
                        let converterData = data.replaceValues[index];
                        val = RedirectRule.converters[converterData.func](val, converterData.val);
                    }
                    catch(e) {
                        throw new Error("Failed to process value. " + e.message);
                    }

                    return val;
                },
                data.replaceString);

            return url;
        }

        private getUpdatedUrlSimple(url: string, data: IRedirectionRuleData): string {
            let uri = new UrlEditor.Uri(url);

            if (data.hostname) {
                uri.hostname(data.hostname);
            }

            if (data.port) {
                uri.port(data.port);
            }

            if (data.path) {
                uri.pathname(data.path);
            }

            if (data.protocol) {
                uri.protocol(data.protocol);
            }

            if (data.paramsToUpdate) {
                let urlParams = uri.params();
                Object.keys(data.paramsToUpdate).forEach(name => {
                    if (data.paramsToUpdate[name] == null) {
                        delete urlParams[name];
                    }
                    else {
                        urlParams[name] = [data.paramsToUpdate[name]]; // TODO allow to pass multiple values
                    }
                });
                uri.params(urlParams);
            }

            let result = uri.url();

            if (data.strReplace) {
                data.strReplace.forEach(keyValuePair => {
                    result = result.replace(keyValuePair[0], keyValuePair[1]);
                });
            }

            return result;
        }
    }

    export class RedirectionManager {
        private redirData: IMap<IRedirectionRuleData>;
        public onMatchingRule: Function;

        constructor(private setts: Settings) {
        }

        save(data: IRedirectionRuleData, name?: string) {
            if (this.redirData) {

                // check if intention is to just delete rule or if rule was renamed
                if (data == null || (name && data.name != name)) {
                    // remove the old entry
                    delete this.redirData[name];
                }

                // check if it's not a delete operation
                if (data != null) {
                    this.redirData[data.name] = data;
                }

                this.setts.setValue("redirectionRules", JSON.stringify(this.redirData));
            }
        }

        getData(): IMap<IRedirectionRuleData> {
            if (!this.redirData) {
                this.redirData = this.setts.redirectionRules ? JSON.parse(this.setts.redirectionRules) : {};
            }

            return this.redirData;
        }

        initOnBeforeRequest(bindOnBeforeRequest: IBindOnBeforeRequestHandler) {

        }
    }

    class RedirectionBackground implements IBackgroundPlugin {
        private redirMgr: RedirectionManager;

        constructor(private settings: Settings, private background: IPageBackground) {

            chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => this.handleMessage(msgData));

            chrome.commands.onCommand.addListener(command => this.onContextMenuClick(command));

            this.initializeRedirections();
        }

        private activeRules: ((requestDetails: chrome.webRequest.WebRequestBodyDetails) => void)[] = [];

        /**
         * Context menu click handler.
         * @param command Context menu command type.
         */
        private onContextMenuClick(command: string) {
            if (command == Command.RedirectUseFirstRule) {
                Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "first_rule");

                this.contextMenuItems[0] && this.contextMenuItems[0].onclick(null, null);
            }
        }

        /**
         * Initializes redirections.
         *
         * It uses fresh/new objects to be sure we use most recent settings.
         */
        private initializeRedirections() {
            // remove old event handlers
            this.activeRules.forEach(l => chrome.webRequest.onBeforeRequest.removeListener(l));
            this.activeRules = [];

            // remove old context menus
            this.background.removeActionContextMenuItem("Redirection");

            this.redirMgr = new RedirectionManager(new Settings(localStorage));

            let rulesData = this.redirMgr.getData();
            Object.keys(rulesData).forEach(name => {
                let data = rulesData[name];

                if (data.isAutomatic) {
                    this.setupAutomaticRule(data);
                }
                else {
                    this.setupContextMenuRuleItem(data);
                }
            });
        }

        private setupAutomaticRule(data: IRedirectionRuleData) {
            // create new wrapper and add it to the list (we need to do it to be able to remove listener later)
            this.activeRules.push(requestDetails => {
                let rule = new RedirectRule(data);
                let newUrl = rule.getUpdatedUrl(requestDetails.url);
                if (newUrl != requestDetails.url) {

                    Tracking.trackEvent(Tracking.Category.Redirect, "automatic");

                    return <chrome.webRequest.BlockingResponse>{
                        redirectUrl: newUrl
                    };
                }
            });

            chrome.webRequest.onBeforeRequest.addListener(
                this.activeRules[this.activeRules.length - 1], // use newly added handler
                { urls: [data.urlFilter] },
                ["blocking"]);
        }

        private setupContextMenuRuleItem(data: IRedirectionRuleData) {

        }

        private handleMessage(msg: string) {
            switch (msg) {
                case Command.ReloadRedirectionRules:
                    this.initializeRedirections();
                    break;
            }
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

    UrlEditor.Plugins.Background.push(RedirectionBackground);
}