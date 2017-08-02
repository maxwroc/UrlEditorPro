///<reference path="../modules/autosuggest.ts" />
///<reference path="../shared/autosuggestpage.ts" />

module UrlEditor.Options.Suggestions {

    const UNBIND = "[Unbind] ";
    const HOST_ALIAS_KEY = "[suggestionAlias]";
    const Page = Shared.AutoSuggestPage;

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
            Shared.autoSuggestData = autoSuggestData; // TODO figure out a better way to pass the data
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

}