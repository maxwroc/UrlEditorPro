
module UrlEditor.Options {

    var settings = new Settings(localStorage);
    var autoSuggestData: IAutoSuggestData;
    
    function initialize() {
        Tracking.init(settings.trackingEnabled);

        document.body.addEventListener("change", evt => {
            var elem = <HTMLInputElement>evt.target;
            if (elem.tagName == "INPUT" && settings[elem.name] != undefined) {
                // save setting
                switch (elem.type) {
                    case "checkbox":
                        settings.setValue(elem.name, elem.checked);
                        Tracking.trackEvent(Tracking.Category.Settings, elem.name, elem.checked.toString());
                        toggleRelatedElem(elem);
                        break;
                    case "radio":
                        if (elem.checked) {
                            Tracking.trackEvent(Tracking.Category.Settings, elem.name, elem.value);
                            settings.setValue(elem.name, elem.value);
                        }
                        toggleRelatedElem(elem);
                        break;
                }

                // apply setting
                switch (elem.name) {
                    case "icon":
                        chrome.browserAction.setIcon({
                            path: elem.value
                        });
                        break;
                }
            }
            else if (elem.tagName == "SELECT") {
                switch (elem.name) {
                    case "page":
                        var pageData = autoSuggestData[elem.value] || {};
                        populateComboBox("autoSuggestParams", Object.keys(pageData), "-- select param --", elem.value);
                        break;
                    case "param":
                        var paramData = autoSuggestData[elem["source"]][elem.value] || [];
                        var paramValuesElem = document.getElementById("autoSuggestParamValues");

                        // clear param list
                        paramValuesElem.innerHTML = "";

                        paramData.forEach(value => {
                            var paramVal = document.createElement("div");

                            var input = document.createElement("input");
                            input.type = "text";
                            input.disabled = true;
                            input.value = value;
                            input.name = "paramValue";
                            paramVal.appendChild(input);

                            var deleteBtn = document.createElement("input");
                            deleteBtn.type = "button";
                            deleteBtn.value = "Delete";
                            deleteBtn.name = "delete";
                            paramVal.appendChild(deleteBtn);

                            paramValuesElem.appendChild(paramVal);
                        });
                        break;
                }
            }
        });

        document.body.addEventListener("click", evt => {
            var elem = <HTMLInputElement>evt.target;
            if (elem.tagName == "INPUT" && elem.name == "delete" && autoSuggestData) {
                var pageElem = <HTMLInputElement>document.getElementById("autoSuggestPages");
                var paramElem = <HTMLInputElement>document.getElementById("autoSuggestParams");
                var paramValues = <HTMLDivElement>document.getElementById("autoSuggestParamValues");

                var saveData = false;

                var subjectElem = <HTMLInputElement>elem.previousElementSibling;

                // check if deleting page
                if (subjectElem == pageElem && autoSuggestData[subjectElem.value]) {
                    if (confirm("Do you want to dletete all (" + Object.keys(autoSuggestData[subjectElem.value]).length + ") parameters for page: " + subjectElem.value)) {
                        Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete page data");
                        delete autoSuggestData[subjectElem.value];

                        // remove element from the list
                        var select = <HTMLSelectElement><any>subjectElem;
                        select.remove(select.selectedIndex);
                        // remove all param values
                        var paramsSelect = <HTMLSelectElement><any>paramElem;
                        paramElem.innerHTML = "";
                        paramElem.value = "";
                        // remove all visible values
                        paramValues.innerHTML = "";

                        saveData = true;
                    }
                }
                // check if deleting param
                else if (subjectElem == paramElem && autoSuggestData[pageElem.value][subjectElem.value]) {
                    if (confirm("Do you want to dletete all (" + Object.keys(autoSuggestData[pageElem.value][subjectElem.value]).length + ") values for parameter: " + subjectElem.value)) {
                        Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete param data");
                        delete autoSuggestData[pageElem.value][subjectElem.value];

                        // remove element from the list
                        var select = <HTMLSelectElement><any>subjectElem;
                        select.remove(select.selectedIndex);
                        // remove all visible values
                        paramValues.innerHTML = "";

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

            // general click tracking
            if (elem.getAttribute) {
                var trackId = elem.getAttribute("track");
                if (trackId) {
                    Tracking.trackEvent(Tracking.Category.Settings, trackId);
                }
            }
        });

        var inputs = document.getElementsByTagName("INPUT");
        for (var i = 0, input: HTMLInputElement; input = <HTMLInputElement>inputs[i]; i++) {
            if (input.name && settings[input.name] != undefined) {
                switch (input.type) {
                    case "checkbox":
                        input.checked = settings[input.name];
                        toggleRelatedElem(input);
                        break;
                    case "radio":
                        if (input.value == settings[input.name]) {
                            input.checked = true;
                            toggleRelatedElem(input);
                        }
                        break;
                }
            }
        }

        let commandToElemIDMap: IStringMap = {
            "_execute_browser_action": "action-shortcut",
            "goToHomepage": "goToHome-shortcut"
        };

        chrome.commands.getAll(commands => {
            commands.forEach(command => {
                if (commandToElemIDMap[command.name]) {
                    document.getElementById(commandToElemIDMap[command.name]).innerText = command.shortcut;
                }
            });
        });

        if (settings.autoSuggestData) {
            autoSuggestData = <IAutoSuggestData>JSON.parse(settings.autoSuggestData);
            populateComboBox("autoSuggestPages", Object.keys(autoSuggestData), "-- select page --");
        }
    }

    function toggleRelatedElem(elem: HTMLInputElement) {
        var paramsAttr = elem.getAttribute("toggleElem"); // format: elemId[|show/hide]
        if (paramsAttr) {
            var params = paramsAttr.split("|");
            var toggleElem = document.getElementById(params[0]);
            var forceValue = params[1];

            if (forceValue == undefined) {
                toggleElem.style.display = elem.checked? "block" : "none";
            }
            else {
                toggleElem.style.display = forceValue.toLowerCase() == "show" ? "block" : "none";
            }
        }
    }

    function populateComboBox(elemId: string, data: string[], defaultValue: string = "--", comboSource: string = "") {
        var combo = <HTMLSelectElement>document.getElementById(elemId);
        combo.innerHTML = "";
        combo["source"] = comboSource;

        data = data || [];

        // add dummy element on the beginning
        data.unshift(defaultValue);

        data.forEach(optionValue => {
            var option = document.createElement("option");
            option.value = option.textContent = optionValue;
            combo.appendChild(option);
        });
    }

    document.addEventListener('DOMContentLoaded', () => initialize());
}