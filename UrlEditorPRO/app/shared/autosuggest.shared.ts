/// <reference path="interfaces.shared.d.ts" />

module UrlEditor.Shared.AutoSuggest {
    const UNBIND = "[Unbind] ";
    const HOST_ALIAS_KEY = "[suggestionAlias]";

    export class Data {

        private autoSuggestData: IAutoSuggestData;

        constructor(private settings: Settings) {
        }

        getData() {
            if (!this.autoSuggestData) {
                this.autoSuggestData = JSON.parse(this.settings.autoSuggestData);
            }

            return this.autoSuggestData;
        }

        getDomains() {
            return Object.keys(this.getData());
        }

        exists(domain: string) {
            return !!this.getData()[domain];
        }

        getPage(domain: string, throwWhenDataMissing = false) {
            if (!this.exists(domain)) {
                if (throwWhenDataMissing) {
                    throw new Error(`Domain data not found! (${domain})`);
                }
                else {
                    // initialize data object
                    this.getData()[domain] = {};
                }
            }

            return new Page(this, domain);
        }

        save() {
            this.settings.setValue("autoSuggestData", JSON.stringify(this.autoSuggestData));
        }
    }

    export class Page {
        private data: IAutoSuggestData;

        constructor(private dataObj: Data, public domain: string) {
            this.data = dataObj.getData();
        }

        bindWith(domainToBind: string) {
            let localTopDomain = this.getTopDomain(this.domain);
            domainToBind = this.getTopDomain(domainToBind);

            if (localTopDomain == domainToBind) {
                return;
            }

            this.mergeParams(localTopDomain, domainToBind);

            // update other domains if they were bind to the bindDomain
            this.dataObj.getDomains().forEach(domain => {
                if (this.data[domain][HOST_ALIAS_KEY] && this.data[domain][HOST_ALIAS_KEY][0] == domainToBind) {
                    this.data[domain][HOST_ALIAS_KEY][0] = localTopDomain;
                }
            });

            this.data[domainToBind] = {};
            this.data[domainToBind][HOST_ALIAS_KEY] = [localTopDomain];
        }

        unbind(domain: string) {
            let rel = this.resolveRelationship(domain);
            this.data[rel.child] = this.data[rel.parent]
        }

        add(paramName: string, paramValue: string) {
            let params = this.getParams();

            // initialize if doesn't exist
            params[paramName] = params[paramName] || [];

            // check if value already exists
            let foundOnPosition = params[paramName].indexOf(paramValue);
            if (foundOnPosition != -1) {
                // remove it as we want to add it on the beginning of the collection later
                params[paramName].splice(foundOnPosition, 1);
            }

            // add value on the beginning
            params[paramName].unshift(paramValue);
        }

        delete() {
            // check if it is top domain
            if (!this.isAlias()) {
                let newTopDomain;
                let params = this.getParamNames();

                // make sure the other domains which were linked to the current one will be updated
                this.dataObj.getDomains().forEach(domain => {
                    if (this.isAlias(domain) && this.getTopDomain(domain) == this.domain) {
                        if (params.length == 0) {
                            // if there are no params we should remove all linked domains
                            delete this.data[domain];
                        }
                        else {
                            if (!newTopDomain) {
                                newTopDomain = domain;
                                this.data[domain] = this.getParams();
                            } else {
                                this.data[domain][HOST_ALIAS_KEY][0] = newTopDomain;
                            }
                        }
                    }
                });
            }

            delete this.data[this.domain];
        }

        deleteParam(name: string) {
            delete this.data[this.getTopDomain()][name];

            let remainningParams = Object.keys(this.getParams());
            if (remainningParams.length == 0) {
                // if no params left remove the domain
                this.delete();
            }
        }

        deleteParamValue(paramName: string, valueToRemove: string) {
            let remainingValues = this.data[this.getTopDomain()][paramName].filter(val => val != valueToRemove);
            this.data[this.getTopDomain()][paramName] = remainingValues;

            // remove param if no values left
            if (remainingValues.length == 0) {
                this.deleteParam(paramName);
            }
        }

        isAlias(name: string = null) {
            return !!this.data[name || this.domain][HOST_ALIAS_KEY];
        }

        getParams() {
            return this.data[this.getTopDomain()]
        }

        getParamNames() {
            return Object.keys(this.getParams());
        }

        getParamValues(name: string) {
            return this.data[this.getTopDomain()][name];
        }

        getTopDomain(page: string = this.domain) {
            let topDomain = page;
            // just in case if there is nesting (which shouldn't happen)
            while (this.data[topDomain][HOST_ALIAS_KEY]) {
                topDomain = this.data[topDomain][HOST_ALIAS_KEY][0];
            }

            return topDomain;
        }

        private resolveRelationship(domain: string, parentLookupEnabled = false) {
            let result = {
                parent: this.domain,
                child: domain
            };

            if (this.data[this.domain][HOST_ALIAS_KEY]) {
                let parentDomain = domain;
                if (this.data[parentDomain][HOST_ALIAS_KEY]) {

                    if (parentLookupEnabled) {
                        // trying to find root
                        parentDomain = this.getTopDomain(domain);
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
            Object.keys(this.data[domainToBind]).forEach(paramName => {
                let result = Array.from(
                    // Set by default removes all dupes
                    new Set(
                        // merging arrays
                        (this.data[parentDomain][paramName] || []).concat(this.data[domainToBind][paramName])
                    ));

                // only update if it's different
                if ((this.data[parentDomain][paramName] || []).length != this.data[domainToBind][paramName].length) {
                    this.data[parentDomain][paramName] = result;
                }
            });
        }
    }
}