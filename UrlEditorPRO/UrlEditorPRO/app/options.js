var UrlEditor;
(function (UrlEditor) {
    var Options;
    (function (Options) {
        var settings = new UrlEditor.Settings(localStorage);
        var autoSuggestData;
        function initialize() {
            document.body.addEventListener("change", function (evt) {
                var elem = evt.target;
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
                            populateComboBox("autoSuggestParams", Object.keys(pageData), "-- select param --", elem.value);
                            break;
                        case "param":
                            var paramData = autoSuggestData[elem["source"]][elem.value] || [];
                            var paramValuesElem = document.getElementById("autoSuggestParamValues");
                            // clear param list
                            paramValuesElem.innerHTML = "";
                            paramData.forEach(function (value) {
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
            document.body.addEventListener("click", function (evt) {
                var input = evt.target;
                if (input.tagName == "INPUT" && input.name == "delete" && autoSuggestData) {
                    var pageElem = document.getElementById("autoSuggestPages");
                    var paramElem = document.getElementById("autoSuggestParams");
                    var paramValues = document.getElementById("autoSuggestParamValues");
                    var saveData = false;
                    var subjectElem = input.previousElementSibling;
                    // check if deleting page
                    if (subjectElem == pageElem && autoSuggestData[subjectElem.value]) {
                        if (confirm("Do you want to dletete all (" + Object.keys(autoSuggestData[subjectElem.value]).length + ") parameters for page: " + subjectElem.value)) {
                            delete autoSuggestData[subjectElem.value];
                            // remove element from the list
                            var select = subjectElem;
                            select.remove(select.selectedIndex);
                            // remove all param values
                            var paramsSelect = paramElem;
                            paramElem.innerHTML = "";
                            paramElem.value = "";
                            // remove all visible values
                            paramValues.innerHTML = "";
                            saveData = true;
                        }
                    }
                    else if (subjectElem == paramElem && autoSuggestData[pageElem.value][subjectElem.value]) {
                        if (confirm("Do you want to dletete all (" + Object.keys(autoSuggestData[pageElem.value][subjectElem.value]).length + ") values for parameter: " + subjectElem.value)) {
                            delete autoSuggestData[pageElem.value][subjectElem.value];
                            // remove element from the list
                            var select = subjectElem;
                            select.remove(select.selectedIndex);
                            // remove all visible values
                            paramValues.innerHTML = "";
                            saveData = true;
                        }
                    }
                    else if (autoSuggestData[pageElem.value] &&
                        autoSuggestData[pageElem.value][paramElem.value] &&
                        autoSuggestData[pageElem.value][paramElem.value].indexOf(subjectElem.value) != -1) {
                        if (confirm("Do you want to delete '" + subjectElem.value + "' value from param '" + paramElem.value + "'")) {
                            autoSuggestData[pageElem.value][paramElem.value] = autoSuggestData[pageElem.value][paramElem.value].filter(function (val) { return val != subjectElem.value; });
                            subjectElem.parentElement.parentElement.removeChild(subjectElem.parentElement);
                            saveData = true;
                        }
                    }
                    if (saveData) {
                        settings.setValue("autoSuggestData", JSON.stringify(autoSuggestData));
                    }
                }
            });
            var inputs = document.getElementsByTagName("INPUT");
            for (var i = 0, input; input = inputs[i]; i++) {
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
            chrome.commands.getAll(function (commands) {
                commands.forEach(function (command) {
                    if (command.name == "_execute_browser_action") {
                        document.getElementById("action-shortcut").innerText = command.shortcut;
                    }
                });
            });
            if (settings.autoSuggestData) {
                autoSuggestData = JSON.parse(settings.autoSuggestData);
                populateComboBox("autoSuggestPages", Object.keys(autoSuggestData), "-- select page --");
            }
        }
        function toggleRelatedElem(elem) {
            var paramsAttr = elem.getAttribute("toggleElem"); // format: elemId[|show/hide]
            if (paramsAttr) {
                var params = paramsAttr.split("|");
                var toggleElem = document.getElementById(params[0]);
                var forceValue = params[1];
                if (forceValue == undefined) {
                    toggleElem.style.display = elem.checked ? "block" : "none";
                }
                else {
                    toggleElem.style.display = forceValue.toLowerCase() == "show" ? "block" : "none";
                }
            }
        }
        function populateComboBox(elemId, data, defaultValue, comboSource) {
            if (defaultValue === void 0) { defaultValue = "--"; }
            if (comboSource === void 0) { comboSource = ""; }
            var combo = document.getElementById(elemId);
            combo.innerHTML = "";
            combo["source"] = comboSource;
            data = data || [];
            // add dummy element on the beginning
            data.unshift(defaultValue);
            data.forEach(function (optionValue) {
                var option = document.createElement("option");
                option.value = option.textContent = optionValue;
                combo.appendChild(option);
            });
        }
        document.addEventListener('DOMContentLoaded', function () { return initialize(); });
    })(Options = UrlEditor.Options || (UrlEditor.Options = {}));
})(UrlEditor || (UrlEditor = {}));
