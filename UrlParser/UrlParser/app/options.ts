
module UrlParser.Options {

    var settings = new Settings(localStorage);
    var autoSuggestData: IAutoSuggestData;
    
    function initialize() {

        document.body.addEventListener("change", evt => {
            var elem = <HTMLInputElement>evt.target;
            if (elem.tagName == "INPUT" && settings[elem.name] != undefined) {
                // save setting
                switch (elem.type) {
                    case "checkbox":
                        settings.setValue(elem.name, elem.checked);
                        toggleRelatedElem(elem);
                        break;
                    case "radio":
                        if (elem.checked) {
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
                        populateComboBox("autoSuggestParams", Object.keys(pageData), "-- select param --");
                        break;
                    case "param":
                        break;
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


        chrome.commands.getAll((commands: any[]) => {
            commands.forEach(command => {
                if (command.name == "_execute_browser_action") {
                    document.getElementById("action-shortcut").innerText = command.shortcut;
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

    function populateComboBox(elemId: string, data: string[], defaultValue: string = "--") {
        var combo = <HTMLSelectElement>document.getElementById(elemId);
        combo.innerHTML = "";

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