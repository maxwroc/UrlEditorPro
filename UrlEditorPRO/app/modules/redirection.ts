///<reference path="settings.ts" />
///<reference path="url_parser.ts" />
///<reference path="regexp.replacer.ts" />

module UrlEditor {

    /**
     * TODO:
     * 1. Action icon indicator showing available redirections
     * 2. Redirect using first rule - shortcut
     * 3. Tracking
     */

    let converters: { [name: string]: (val: string, arg: string) => string } = {};
    converters.leaveAsIs = val => val;
    converters.replaceWith = (val, arg) => {
        return arg;
    }
    converters.increment = (val, arg) => (parseInt(val) + parseInt(arg)).toString();
    converters.decrease = (val, arg) => (parseInt(val) - parseInt(arg)).toString();
    converters.urlEncode = (val) => encodeURIComponent(val);
    converters.urlDecode = (val) => decodeURIComponent(val);
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
                this.redirData = JSON.parse(this.setts.redirectionRules);
            }

            return this.redirData;
        }

        initOnBeforeRequest(bindOnBeforeRequest: IBindOnBeforeRequestHandler) {
            let rulesData = this.getData();
            Object.keys(rulesData).forEach(name => {
                let data = rulesData[name];
                bindOnBeforeRequest(
                    data.urlFilter,
                    name,
                    (requestDetails, force) => {
                        if (data.isAutomatic || force) {
                            let rule = new RedirectRule(data);
                            let newUrl = rule.getUpdatedUrl(requestDetails.url);
                            if (newUrl != requestDetails.url) {
                                return <chrome.webRequest.BlockingResponse>{
                                    redirectUrl: newUrl
                                };
                            }
                        }
                    },
                    ["blocking"]
                );
            });
        }
    }
}