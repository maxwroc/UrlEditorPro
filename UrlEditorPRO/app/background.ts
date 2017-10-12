/// <reference path="modules/url_parser.ts" />
/// <reference path="../../typings/index.d.ts" />

module UrlEditor {
    chrome.commands.onCommand.addListener(command => {
        if (command == "goToHomepage") {
            chrome.tabs.getSelected(null, function (tab) {
                let uri = new UrlEditor.Uri(tab.url);
                chrome.tabs.update(tab.id, { url: uri.protocol() + "//" + uri.host() });
            });
        }
    });

    class RedirectRule {
        constructor(public urlFilter: string, private replaceData: IRedirectReplaceData) {
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

    interface IRedirectReplaceData {
        protocol?: string,
        hostname?: string,
        port?: number,
        paramsToUpdate?: IMap<string>,
        strReplace?: string[][];
    }

    let rules: RedirectRule[] = [];
    rules.push(new RedirectRule("http://localhost/*traffictype=Internal_monitor*", {
        hostname: "maksymc-srv",
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
            TestSelectionId: null
        }
    }));

    rules.forEach(r => {
        chrome.webRequest.onBeforeRequest.addListener(
            requestDetails => {
                let newUrl = r.getUpdatedUrl(requestDetails.url);
                if (newUrl != requestDetails.url) {
                    return <chrome.webRequest.BlockingResponse>{
                        redirectUrl: newUrl
                    };
                }
            },
            { urls: [r.urlFilter] }, //  filters
            ["blocking"]
        );
    })

}
