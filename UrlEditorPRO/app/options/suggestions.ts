///<reference path="../modules/autosuggest.ts" />

module UrlEditor.Options.Suggestions {

    const UNBIND = "[Unbind] ";

    let autoSuggestData: IAutoSuggestData;
    let settings: Settings;

    let pageElem: HTMLSelectElement;
    let paramElem: HTMLSelectElement;
    let bindToElem: HTMLSelectElement;
    let paramValuesContainer: HTMLDivElement;

    // init will be automatically called once the main code is initialized and ready
    bindOnInitializedHandler(settings => init(settings));

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

    function handleSelect(evt) {
        let elem = <HTMLSelectElement>evt.target;
        if (elem.tagName == "SELECT") {
            switch (elem.name) {
                case "page":
                    let alias = autoSuggestData[elem.value] &&
                        autoSuggestData[elem.value][AutoSuggest.HOST_ALIAS_KEY] &&
                        autoSuggestData[elem.value][AutoSuggest.HOST_ALIAS_KEY][0];

                    let pageData = alias ? autoSuggestData[alias] : autoSuggestData[elem.value]
                    if (pageData) {
                        populateComboBox(paramElem, Object.keys(pageData), "-- select param --", elem.value);
                    }

                    let selectedIndex = 0;
                    let defaultText = "-- select website to (un)bind --";

                    let filteredWebsites = Object.keys(autoSuggestData)
                        // remove subject page
                        .filter(x => x != elem.value)
                        // add "unbind" if bind already
                        .map(x => {
                            if (x == alias ||
                                autoSuggestData[x] &&
                                autoSuggestData[x][AutoSuggest.HOST_ALIAS_KEY] &&
                                autoSuggestData[x][AutoSuggest.HOST_ALIAS_KEY][0] == elem.value) {
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

        // check if deleting page
        if (subjectElem == pageElem && autoSuggestData[subjectElem.value]) {
            if (confirm("Do you want to dletete all (" + Object.keys(autoSuggestData[subjectElem.value]).length + ") parameters for page: " + subjectElem.value)) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete page data");
                delete autoSuggestData[subjectElem.value];

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
        else if (subjectElem == paramElem && autoSuggestData[pageElem.value][subjectElem.value]) {
            if (confirm("Do you want to dletete all (" + Object.keys(autoSuggestData[pageElem.value][subjectElem.value]).length + ") values for parameter: " + subjectElem.value)) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete param data");
                delete autoSuggestData[pageElem.value][subjectElem.value];

                // remove element from the list
                let select = <HTMLSelectElement><any>subjectElem;
                select.remove(select.selectedIndex);
                // remove all visible values
                paramValuesContainer.innerHTML = "";

                saveData = true;
            }
        }
        // check if deleting value
        else if (autoSuggestData[pageElem.value] &&
            autoSuggestData[pageElem.value][paramElem.value] &&
            autoSuggestData[pageElem.value][paramElem.value].indexOf(subjectElem.value) != -1) {
            if (confirm("Do you want to delete '" + subjectElem.value + "' value from param '" + paramElem.value + "'")) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete param value");
                autoSuggestData[pageElem.value][paramElem.value] = autoSuggestData[pageElem.value][paramElem.value].filter(val => val != subjectElem.value);
                subjectElem.parentElement.parentElement.removeChild(subjectElem.parentElement);
                saveData = true;
            }
        }

        if (saveData) {
            settings.setValue("autoSuggestData", JSON.stringify(autoSuggestData));
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
                // double check which one is the alias
                if (autoSuggestData[subjectPage][AutoSuggest.HOST_ALIAS_KEY]) {
                    autoSuggestData[subjectPage] = autoSuggestData[targetPage];
                }
                else {
                    autoSuggestData[targetPage] = autoSuggestData[subjectPage];
                }
            }
            else {
                Object.keys(autoSuggestData[targetPage]).forEach(paramName => {
                    // merging arrays making sure that we won't have any dupes
                    let result = Array.from(
                        new Set(
                            (autoSuggestData[subjectPage][paramName] || []).concat(autoSuggestData[targetPage][paramName])
                        ));

                    if ((autoSuggestData[subjectPage][paramName] || []).length != autoSuggestData[targetPage][paramName].length) {
                        autoSuggestData[subjectPage][paramName] = result;
                    }
                });

                autoSuggestData[targetPage] = {};
                autoSuggestData[targetPage][AutoSuggest.HOST_ALIAS_KEY] = [subjectPage];
            }

            settings.setValue("autoSuggestData", JSON.stringify(autoSuggestData));
        }
    }

    function saveAutoSuggestData() {
        settings.setValue("autoSuggestData", JSON.stringify(autoSuggestData));
    }
}