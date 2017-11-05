///<reference path="settings.ts" />
///<reference path="url_parser.ts" />

module UrlEditor {

    export class RedirectRule {
        public urlFilter: string;
        public isAutomatic: boolean;

        constructor(private replaceData: IRedirectionRuleData) {
            this.urlFilter = replaceData.urlFilter;
            this.isAutomatic = replaceData.isAutomatic;
        }

        isUrlSupported(url: string): boolean {
            let reg = new RegExp("^" + this.urlFilter.replace(/[*]/g, ".*") + "$");
            return reg.test(url);
        }

        getUpdatedUrl(url: string): string {
            let uri = new UrlEditor.Uri(url);

            if (this.replaceData.hostname) {
                uri.hostname(this.replaceData.hostname);
            }

            if (this.replaceData.port) {
                uri.port(this.replaceData.port);
            }

            if (this.replaceData.protocol) {
                uri.protocol(this.replaceData.protocol);
            }

            if (this.replaceData.paramsToUpdate) {
                let urlParams = uri.params();
                Object.keys(this.replaceData.paramsToUpdate).forEach(name => {
                    if (this.replaceData.paramsToUpdate[name] == null) {
                        delete urlParams[name];
                    }
                    else {
                        urlParams[name] = [this.replaceData.paramsToUpdate[name]]; // TODO allow to pass multiple values
                    }
                });
                uri.params(urlParams);
            }

            let result = uri.url();

            if (this.replaceData.strReplace) {
                this.replaceData.strReplace.forEach(keyValuePair => {
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

        save() {
            if (this.redirData) {
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
                    requestDetails => {
                        let rule = new RedirectRule(data);
                        let newUrl = rule.getUpdatedUrl(requestDetails.url);
                        if (newUrl != requestDetails.url) {
                            return <chrome.webRequest.BlockingResponse>{
                                redirectUrl: newUrl
                            };
                        }
                    },
                    ["blocking"]
                );
            });
        }
    }
}