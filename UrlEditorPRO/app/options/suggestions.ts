///<reference path="../modules/autosuggest.ts" />
///<reference path="../shared/autosuggest.shared.ts" />

module UrlEditor.Options.Suggestions {

    const UNBIND = "[Unbind] ";
    const HOST_ALIAS_KEY = "[suggestionAlias]";
    const Page = Shared.AutoSuggest.Page;
    const AutoSuggestData = Shared.AutoSuggest.Data;

    let autoSuggestData: Shared.AutoSuggest.Data;
    let settings: Settings;

    let domainsElem: HTMLSelectElement;
    let paramNamesElem: HTMLSelectElement;
    let bindToDomainElem: HTMLSelectElement;
    let paramValuesContainer: HTMLDivElement;

    export function init(setts: Settings) {
        settings = setts;

        let recentlyUsedParamsModule = Helpers.ge("recentlyUsedParamsModule");
        recentlyUsedParamsModule.addEventListener("click", handleClick)
        recentlyUsedParamsModule.addEventListener("change", evt => handleSelect(<HTMLSelectElement>evt.target))

        domainsElem = Helpers.ge<HTMLSelectElement>("autoSuggestPages");
        paramNamesElem = Helpers.ge<HTMLSelectElement>("autoSuggestParams");
        bindToDomainElem = Helpers.ge<HTMLSelectElement>("autoSuggestPageToBind");
        paramValuesContainer = Helpers.ge<HTMLDivElement>("autoSuggestParamValues");

        autoSuggestData = new AutoSuggestData(settings);

        let domainList = autoSuggestData.getDomains();
        if (domainList.length) {
            populateComboBox(domainsElem, domainList, "-- select page --");
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
                    saveBinding();
                    domainsElem.selectedIndex = 0;
                    handleSelect(domainsElem);
                    break;

                case "delete":
                    handleSuggestionDelete(elem);
                    break;
            }
        }
    }

    function handleSelect(elem: HTMLSelectElement) {
        let page: Shared.AutoSuggest.Page;
        if (elem.tagName == "SELECT") {
            switch (elem.name) {
                case "page":
                    page = autoSuggestData.getPage(elem.value);

                    populateComboBox(paramNamesElem, page.getParamNames(), "-- select param --", elem.value);
                    // clear param list
                    paramValuesContainer.innerHTML = "";

                    let selectedIndex = 0;
                    let defaultText = "-- select website to (un)bind --";

                    let filteredWebsites = autoSuggestData.getDomains()
                        // remove subject page
                        .filter(x => x != elem.value && (!page.isAlias(x) || page.getTopDomain(x) == elem.value))
                        // add "unbind" if bind already
                        .map(x => {
                            if (x == page.getTopDomain() || page.getTopDomain(x) == elem.value) {
                                x = "[Unbind] " + x;
                            }
                            return x;
                        });

                    populateComboBox(bindToDomainElem, filteredWebsites, defaultText, elem.value, selectedIndex);
                    break;
                case "param":
                    let domainName = elem["source"];
                    page = autoSuggestData.getPage(domainName);
                    let paramData = page.getParamValues(elem.value) || [];

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

        if (!autoSuggestData.exists(domainsElem.value)) {
            // gracefully fail
            return;
        }

        let saveData = false;
        let page = autoSuggestData.getPage(domainsElem.value);
        let subjectElem = <HTMLSelectElement>elem.previousElementSibling;

        // check if deleting page
        if (subjectElem == domainsElem) {
            let message = "Do you want to dletete all (" + page.getParamNames().length + ") parameters for page: " + subjectElem.value;
            if (page.isAlias() || Suggestions.confirmWrapper(message)) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete page data");

                page.delete();

                // remove element from the list
                let select = <HTMLSelectElement><any>subjectElem;
                select.remove(select.selectedIndex);
                // remove all param values
                let paramsSelect = <HTMLSelectElement><any>paramNamesElem;
                paramNamesElem.innerHTML = "";
                paramNamesElem.value = "";
                // remove all visible values
                paramValuesContainer.innerHTML = "";

                saveData = true;
            }
        }
        // check if deleting param
        else if (subjectElem == paramNamesElem && page.getParams()[paramNamesElem.value]) {
            let message = "Do you want to detete all (" + page.getParamValues(paramNamesElem.value).length + ") values together with parameter: " + subjectElem.value;
            if (Suggestions.confirmWrapper(message)) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete param data");

                page.deleteParam(paramNamesElem.value);

                // remove element from the list
                let select = <HTMLSelectElement><any>subjectElem;
                select.remove(select.selectedIndex);
                // remove all visible values
                paramValuesContainer.innerHTML = "";

                saveData = true;
            }
        }
        // check if deleting value
        else if (page.getParamValues(paramNamesElem.value).indexOf(subjectElem.value) != -1) {
            if (Suggestions.confirmWrapper("Do you want to delete '" + subjectElem.value + "' value from param '" + paramNamesElem.value + "'")) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete param value");

                page.deleteParamValue(paramNamesElem.value, subjectElem.value);

                subjectElem.parentElement.parentElement.removeChild(subjectElem.parentElement);
                saveData = true;
            }
        }

        if (saveData) {
            autoSuggestData.save();
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

    function saveBinding() {
        let subjectPage = domainsElem.value
        let targetPage = bindToDomainElem.value;
        let unbinding = false;

        if (subjectPage.startsWith("-- ") || targetPage.startsWith("-- ")) {
            throw new Error("Bind subject must be a valid, existing page")
        }

        if (targetPage.startsWith(UNBIND)) {
            targetPage = targetPage.substr(UNBIND.length);
            unbinding = true;
        }

        if (targetPage && autoSuggestData.exists(targetPage)) {

            if (unbinding) {
                autoSuggestData.getPage(subjectPage).unbind(targetPage);
            }
            else {
                autoSuggestData.getPage(subjectPage).bindWith(targetPage);
            }

            autoSuggestData.save();
        }
    }
}