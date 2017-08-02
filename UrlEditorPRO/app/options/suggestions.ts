///<reference path="../modules/autosuggest.ts" />

module UrlEditor.Options.Suggestions {

    const UNBIND = "[Unbind] ";
    const HOST_ALIAS_KEY = "[suggestionAlias]";

    let autoSuggestData: IAutoSuggestData;
    let settings: Settings;

    let pageElem: HTMLSelectElement;
    let paramElem: HTMLSelectElement;
    let bindToElem: HTMLSelectElement;
    let paramValuesContainer: HTMLDivElement;

    export function init(setts: Settings) {
        settings = setts;

        let recentlyUsedParamsModule = Helpers.ge("recentlyUsedParamsModule");
        recentlyUsedParamsModule.addEventListener("click", handleClick)
        recentlyUsedParamsModule.addEventListener("change", handleSelect)

        pageElem = Helpers.ge<HTMLSelectElement>("autoSuggestPages");
        paramElem = Helpers.ge<HTMLSelectElement>("autoSuggestParams");
        bindToElem = Helpers.ge<HTMLSelectElement>("autoSuggestPageToBind");
        paramValuesContainer = Helpers.ge<HTMLDivElement>("autoSuggestParamValues");

        if (settings.autoSuggestData) {
            autoSuggestData = <IAutoSuggestData>JSON.parse(settings.autoSuggestData);
            populateComboBox(pageElem, Object.keys(autoSuggestData), "-- select page --");
        }
    }

    export function confirmWrapper(message: string): boolean {
        return confirm(message);
    }

    function handleClick(evt: Event) {
        let elem = <HTMLInputElement>evt.target;

        if (elem.tagName == "INPUT") {
            switch (elem.name) {
                case "saveBinding":
                    saveBinding(autoSuggestData);
                    break;

                case "delete":
                    if (autoSuggestData) {
                        handleSuggestionDelete(elem);
                    }
                    break;
            }
        }
    }

    function getBasePageName(pageName: string) {
        return autoSuggestData[pageName] &&
            autoSuggestData[pageName][HOST_ALIAS_KEY] &&
            autoSuggestData[pageName][HOST_ALIAS_KEY][0];
    }

    function handleSelect(evt) {
        let elem = <HTMLSelectElement>evt.target;
        if (elem.tagName == "SELECT") {
            switch (elem.name) {
                case "page":
                    let alias = getBasePageName(elem.value);

                    let pageData = alias ? autoSuggestData[alias] : autoSuggestData[elem.value]
                    if (pageData) {
                        populateComboBox(paramElem, Object.keys(pageData), "-- select param --", elem.value);
                    }

                    let selectedIndex = 0;
                    let defaultText = "-- select website to (un)bind --";

                    let filteredWebsites = Object.keys(autoSuggestData)
                        // remove subject page
                        .filter(x => x != elem.value && (!getBasePageName(x) || getBasePageName(x) == elem.value))
                        // add "unbind" if bind already
                        .map(x => {
                            if (x == alias || getBasePageName(x) == elem.value) {
                                x = "[Unbind] " + x;
                            }
                            return x;
                        });

                    populateComboBox(bindToElem, filteredWebsites, defaultText, elem.value, selectedIndex);
                    break;
                case "param":
                    let paramData = autoSuggestData[elem["source"]][elem.value] || [];

                    // clear param list
                    paramValuesContainer.innerHTML = "";

                    paramData.forEach(value => {
                        let paramVal = document.createElement("div");

                        let input = document.createElement("input");
                        input.type = "text";
                        input.disabled = true;
                        input.value = value;
                        input.name = "paramValue";
                        paramVal.appendChild(input);

                        let deleteBtn = document.createElement("input");
                        deleteBtn.type = "button";
                        deleteBtn.value = "Delete";
                        deleteBtn.name = "delete";
                        paramVal.appendChild(deleteBtn);

                        paramValuesContainer.appendChild(paramVal);
                    });
                    break;
            }
        }
    }

    function handleSuggestionDelete(elem: HTMLInputElement) {

        let saveData = false;

        let subjectElem = <HTMLSelectElement>elem.previousElementSibling;

        let page = new Page(pageElem.value);

        // check if deleting page
        if (subjectElem == pageElem && autoSuggestData[subjectElem.value]) {
            let message = "Do you want to dletete all (" + Object.keys(page.getParams()).length + ") parameters for page: " + subjectElem.value;
            if (page.isAlias() || Suggestions.confirmWrapper(message)) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete page data");

                page.delete();

                // remove element from the list
                let select = <HTMLSelectElement><any>subjectElem;
                select.remove(select.selectedIndex);
                // remove all param values
                let paramsSelect = <HTMLSelectElement><any>paramElem;
                paramElem.innerHTML = "";
                paramElem.value = "";
                // remove all visible values
                paramValuesContainer.innerHTML = "";

                saveData = true;
            }
        }
        // check if deleting param
        else if (subjectElem == paramElem && page.getParams()[paramElem.value]) {
            let message = "Do you want to detete all (" + page.getParamValues(paramElem.value).length + ") values together with parameter: " + subjectElem.value;
            if (Suggestions.confirmWrapper(message)) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete param data");

                page.deleteParam(paramElem.value);

                // remove element from the list
                let select = <HTMLSelectElement><any>subjectElem;
                select.remove(select.selectedIndex);
                // remove all visible values
                paramValuesContainer.innerHTML = "";

                saveData = true;
            }
        }
        // check if deleting value
        else if (page.getParamValues(paramElem.value).indexOf(subjectElem.value) != -1) {
            if (Suggestions.confirmWrapper("Do you want to delete '" + subjectElem.value + "' value from param '" + paramElem.value + "'")) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete param value");

                page.deleteParamValue(paramElem.value, subjectElem.value);

                subjectElem.parentElement.parentElement.removeChild(subjectElem.parentElement);
                saveData = true;
            }
        }

        if (saveData) {
            saveAutoSuggestData();
        }
    }

    function populateComboBox(combo: HTMLSelectElement, data: string[], defaultValue: string = "--", comboSource: string = "", selectedIndex: number = undefined) {
        combo.innerHTML = "";
        combo["source"] = comboSource;

        data = data || [];

        // add dummy element on the beginning
        data.unshift(defaultValue);

        data.forEach(optionValue => {
            let option = document.createElement("option");
            option.value = option.textContent = optionValue;
            combo.appendChild(option);
        });

        if (selectedIndex != undefined) {
            combo.selectedIndex = selectedIndex;
        }
    }

    function saveBinding(autoSuggestData: IAutoSuggestData) {
        let subjectPage = pageElem.value
        let targetPage = bindToElem.value;
        let unbinding = false;

        if (subjectPage.startsWith("-- ") || targetPage.startsWith("-- ")) {
            throw new Error("Bind subject must be a valid, existing page")
        }

        if (targetPage.startsWith(UNBIND)) {
            targetPage = targetPage.substr(UNBIND.length);
            unbinding = true;
        }

        if (targetPage && autoSuggestData[targetPage]) {

            if (unbinding) {
                new Page(subjectPage).unbind(new Page(targetPage));
            }
            else {
                new Page(subjectPage).bindWith(new Page(targetPage));
            }

            saveAutoSuggestData();
        }
    }

    function saveAutoSuggestData() {
        settings.setValue("autoSuggestData", JSON.stringify(autoSuggestData));
    }

    class Page {
        constructor(public domain: string) {
        }

        bindWith(page: Page) {
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

        unbind(page: Page) {
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

        private resolveRelationship(targetPage: Page, parentLookupEnabled = false) {
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