///<reference path="../modules/shared_interfaces.d.ts" />

module UrlEditor.Shared {
    const UNBIND = "[Unbind] ";
    const HOST_ALIAS_KEY = "[suggestionAlias]";

    export let autoSuggestData: IAutoSuggestData;

    export class AutoSuggestPage {
        constructor(public domain: string) {
        }

        bindWith(page: AutoSuggestPage) {
            let localTopDomain = this.getTopDomain(this.domain);
            let bindDomain = this.getTopDomain(page.domain);

            if (localTopDomain == bindDomain) {
                return;
            }

            this.mergeParams(localTopDomain, bindDomain);

            // update other domains if they were bind to the bindDomain
            Object.keys(autoSuggestData).forEach(domain => {
                if (autoSuggestData[domain][HOST_ALIAS_KEY] && autoSuggestData[domain][HOST_ALIAS_KEY][0] == bindDomain) {
                    autoSuggestData[domain][HOST_ALIAS_KEY][0] = localTopDomain;
                }
            });

            autoSuggestData[bindDomain] = {};
            autoSuggestData[bindDomain][HOST_ALIAS_KEY] = [localTopDomain];
        }

        unbind(page: AutoSuggestPage) {
            let rel = this.resolveRelationship(page);
            autoSuggestData[rel.child] = autoSuggestData[rel.parent]
        }

        delete() {
            // check if it is top domain
            if (!this.isAlias()) {
                let newTopDomain;
                // make sure the other domains which were linked to the current one will be updated
                Object.keys(autoSuggestData).forEach(domain => {
                    if (this.isAlias(domain) && this.getTopDomain(domain) == this.domain) {
                        if (!newTopDomain) {
                            newTopDomain = domain;
                            autoSuggestData[domain] = this.getParams();
                        } else {
                            autoSuggestData[domain][HOST_ALIAS_KEY][0] = newTopDomain;
                        }
                    }
                });
            }

            delete autoSuggestData[this.domain];
        }

        deleteParam(name: string) {
            delete autoSuggestData[this.getTopDomain()][name];

            let remainningParams = Object.keys(this.getParams());
            if (remainningParams.length = 0) {
                // if no params left remove the domain
                this.delete();
            }
        }

        deleteParamValue(paramName: string, valueToRemove: string) {
            let remainingValues = autoSuggestData[this.getTopDomain()][paramName].filter(val => val != valueToRemove);
            autoSuggestData[this.getTopDomain()][paramName] = remainingValues;

            // remove param if no values left
            if (remainingValues.length) {
                this.deleteParam(paramName);
            }
        }

        isAlias(name: string = null) {
            return !!autoSuggestData[name || this.domain][HOST_ALIAS_KEY];
        }

        getParams() {
            return autoSuggestData[this.getTopDomain()]
        }

        getParamValues(name: string) {
            return autoSuggestData[this.getTopDomain()][name];
        }

        private getTopDomain(page: string = this.domain) {
            let topDomain = page;
            // just in case if there is nesting (which shouldn't happen)
            while (autoSuggestData[topDomain][HOST_ALIAS_KEY]) {
                topDomain = autoSuggestData[topDomain][HOST_ALIAS_KEY][0];
            }

            return topDomain;
        }

        private resolveRelationship(targetPage: AutoSuggestPage, parentLookupEnabled = false) {
            let result = {
                parent: this.domain,
                child: targetPage.domain
            };

            if (autoSuggestData[this.domain][HOST_ALIAS_KEY]) {
                let parentDomain = targetPage.domain;
                if (autoSuggestData[parentDomain][HOST_ALIAS_KEY]) {

                    if (parentLookupEnabled) {
                        // trying to find root
                        parentDomain = this.getTopDomain(targetPage.domain);
                    } else {
                        throw new Error("Binding failed. Both pages are aliases.");
                    }
                }

                // swap
                result.parent = parentDomain;
                result.child = this.domain;
            }

            return result;
        }

        private mergeParams(parentDomain, domainToBind) {
            Object.keys(autoSuggestData[domainToBind]).forEach(paramName => {
                let result = Array.from(
                    // Set by default removes all dupes
                    new Set(
                        // merging arrays
                        (autoSuggestData[parentDomain][paramName] || []).concat(autoSuggestData[domainToBind][paramName])
                    ));

                // only update if it's different
                if ((autoSuggestData[parentDomain][paramName] || []).length != autoSuggestData[domainToBind][paramName].length) {
                    autoSuggestData[parentDomain][paramName] = result;
                }
            });
        }
    }
}