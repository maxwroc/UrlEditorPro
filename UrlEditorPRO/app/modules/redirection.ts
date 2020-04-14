///<reference path="../shared/shared.ts" />
///<reference path="settings.ts" />
///<reference path="url_parser.ts" />
///<reference path="regexp.replacer.ts" />

module UrlEditor {

    interface IOnBeforeRequestHandler {
        (requestDetails: chrome.webRequest.WebRequestBodyDetails): chrome.webRequest.BlockingResponse;
    }

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

    const ContextMenuGroupName = "Redirections";

    /**
     * Redirection rule definition
     */
    export class RedirectRule {
        public urlFilter: string;
        public isAutomatic: boolean;
        public name: string;

        static converters = converters;

        constructor(private ruleData: IRuleData) {
            this.name = ruleData.name;
            this.urlFilter = ruleData.urlFilter;
            this.isAutomatic = ruleData.isAutomatic;
        }

        /**
         * Checks if given url is supported by this rule
         * @param url Url to validate
         */
        isUrlSupported(url: string): boolean {
            // check if rule is disabled
            if (this.ruleData.disabledReason) {
                return false;
            }

            let reg = new RegExp("^" + this.urlFilter.replace(/[*]/g, ".*") + "$");
            return reg.test(url);
        }

        /**
         * Gets new url where user will be redirected
         * @param url Url to transform
         */
        getUpdatedUrl(url: string): string {
            return (<IRegExpRuleData>this.ruleData).regExp ?
                this.getUpdatedUrlAdvanced(url, this.ruleData as IRegExpRuleData) :
                this.getUpdatedUrlSimple(url, this.ruleData as IRedirectionRuleData);
        }

        disable(reason: string) {
            this.ruleData.disabledReason = reason;
        }

        getData() {
            return this.ruleData;
        }

        /**
         * Regexp based url transformation
         * @param url Url to transform
         * @param data Rule details
         */
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

        /**
         * Field based url transformation
         * @param url Url to transform
         * @param data Rule details
         */
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
        private rules: RedirectRule[];
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

        getRedirectionRules(): RedirectRule[] {
            if (!this.rules) {
                const data = this.getData();
                this.rules = Object.keys(data).map(name => new RedirectRule(data[name]))
            }

            return this.rules;
        }

        isUrlSupportedByAnyAutoRule(url: string, nameToSkip = null): boolean {
            return this.getRedirectionRules().some(rule => rule.isAutomatic && rule.isUrlSupported(url) && (nameToSkip == null || rule.name != nameToSkip));
        }
    }

    class RedirectionBackground implements IBackgroundPlugin {
        private redirMgr: RedirectionManager;

        constructor(private settings: Settings, private background: IPageBackground) {

            chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => this.handleMessage(msgData));

            chrome.commands.onCommand.addListener(command => this.onKeyboardShortcut(command));

            this.initializeRedirections();
        }

        private activeAutoRedirections: IOnBeforeRequestHandler[] = [];

        /**
         * Keyboard shortcut handler.
         * @param command Command type/name.
         */
        private onKeyboardShortcut(command: string) {
            if (command == Command.RedirectUseFirstRule) {
                Helpers.getActiveTab(tab => {
                    let contextMenuItems = this.background.getActiveActionContextMenuItems(tab, ContextMenuGroupName);
                    if (contextMenuItems[0]) {
                        Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "first_rule");
                        contextMenuItems[0].onclick(null, tab);
                    }
                    else {
                        Tracking.trackEvent(Tracking.Category.Redirect, "keyboard", "no_rule_available");
                    }
                });
            }
        }

        /**
         * Initializes redirections.
         *
         * It uses fresh/new objects to be sure we use most recent settings.
         */
        private initializeRedirections() {
            // remove old event handlers
            this.activeAutoRedirections.forEach(l => chrome.webRequest.onBeforeRequest.removeListener(l));
            this.activeAutoRedirections = [];

            // remove old context menus
            this.background.removeActionContextMenuItem(ContextMenuGroupName);

            this.redirMgr = new RedirectionManager(new Settings(localStorage));

            const allRules = this.redirMgr.getRedirectionRules();
            allRules.forEach(rule => {

                // check if rule is url-triggering
                if (rule.isAutomatic) {
                    this.setupAutomaticRule(rule);
                }
                else {
                    this.setupContextMenuRuleItem(rule);
                }
            });
        }

        /**
         * Setup for url-trggered rule.
         * @param data Rule details
         */
        private setupAutomaticRule(rule: RedirectRule) {
            // create new wrapper and add it to the list (we need to do it to be able to remove listener later)
            this.activeAutoRedirections.push(requestDetails => {

                let newUrl = rule.getUpdatedUrl(requestDetails.url);
                if (newUrl != requestDetails.url) {

                    // prevent from redirection loop
                    if (this.redirMgr.isUrlSupportedByAnyAutoRule(newUrl)) {
                        rule.disable("Potential redirection loop detected. Produced url cannot be matched by any redirection rule.");
                        this.redirMgr.save(rule.getData());
                        return null;
                    }

                    Tracking.trackEvent(Tracking.Category.Redirect, "automatic");

                    return <chrome.webRequest.BlockingResponse>{
                        redirectUrl: newUrl
                    };
                }

                return null;
            });

            chrome.webRequest.onBeforeRequest.addListener(
                this.activeAutoRedirections[this.activeAutoRedirections.length - 1], // use newly added handler
                { urls: [rule.urlFilter] },
                ["blocking"]);
        }

        /**
         * Setup for context menu rule.
         * @param data Rule details
         */
        private setupContextMenuRuleItem(rule: RedirectRule) {
            this.background.addActionContextMenuItem({
                clickHandler: (info, tab) => {
                    let newUrl = rule.getUpdatedUrl(tab.url);
                    if (tab.url != newUrl) {
                        Tracking.trackEvent(Tracking.Category.Redirect, "click", "context_menu");
                        chrome.tabs.update(tab.id, { url: newUrl });
                    }
                },
                group: ContextMenuGroupName,
                label: "Redirect: " + rule.name,
                isEnabled: tab => rule.isUrlSupported(tab.url)
            });
        }

        /**
         * Handles messages/commands send by UI.
         * @param msg Incommong message/command
         */
        private handleMessage(msg: string) {
            switch (msg) {
                case Command.ReloadRedirectionRules:
                    this.initializeRedirections();
                    break;
            }
        }
    }

    UrlEditor.Plugins.Background.push(RedirectionBackground);
}