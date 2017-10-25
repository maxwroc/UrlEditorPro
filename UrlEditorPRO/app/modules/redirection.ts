module UrlEditor {

    export class RedirectRule {
        public urlFilter: string;

        constructor(private replaceData: IRedirectReplaceData) {
            this.urlFilter = replaceData.urlFilter;
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
        private rules: RedirectRule[] = [];

        constructor(private bindOnBeforeRequest: IBindOnBeforeRequestHandler) {
        }

        addRule(redirectionData: IRedirectReplaceData) {
            this.rules.push(new RedirectRule(redirectionData));
        }

        init() {
            this.rules.forEach(r => {
                this.bindOnBeforeRequest(
                    r.urlFilter,
                    requestDetails => {
                        let newUrl = r.getUpdatedUrl(requestDetails.url);
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

    let redirect = new RedirectionManager((urlFilter, handler, infoSpec) => {
        chrome.webRequest.onBeforeRequest.addListener(r => handler(r), { urls: [urlFilter] }, infoSpec);
    });

    redirect.addRule({
        urlFilter: "*://localhost/*traffictype=Internal_monitor*",
        hostname: "maksymc-srv",
        protocol: "http",
        paramsToUpdate: {
            istest: null,
            setvar: null,
            rb: null,
            setmkt: null,
            testtype: null,
            testcodehash: null,
            testidentifier: null,
            logjserror: null,
            ClientIP: null,
            traffictype: null,
            fdtrace: null,
            corpnet: null,
            TestSelectionId: null,
            disableAppCache: "1"
        }
    });

    redirect.init();


}