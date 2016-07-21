var UrlParser;
(function (UrlParser) {
    var Options;
    (function (Options) {
        var settings = new UrlParser.Settings(localStorage);
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
                            populateComboBox("autoSuggestParams", Object.keys(pageData), "-- select param --");
                            break;
                        case "param":
                            break;
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
        function populateComboBox(elemId, data, defaultValue) {
            if (defaultValue === void 0) { defaultValue = "--"; }
            var combo = document.getElementById(elemId);
            combo.innerHTML = "";
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
    })(Options = UrlParser.Options || (UrlParser.Options = {}));
})(UrlParser || (UrlParser = {}));
