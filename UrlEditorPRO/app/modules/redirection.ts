///<reference path="settings.ts" />
///<reference path="url_parser.ts" />
///<reference path="regexp.replacer.ts" />

module UrlEditor {

    export class RedirectRule {
        public urlFilter: string;
        public isAutomatic: boolean;

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
            if (data.replaceString) {
                url = url.replace(new RegExp(data.regExp, "g"), data.replaceString);
            }
            else {
                let r = new RegExpGroupReplacer(data.regExp);
                url = r.replace(url, (val, index) => {
                    return val;
                });
            }

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