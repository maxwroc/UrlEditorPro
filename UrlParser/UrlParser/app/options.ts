
module UrlParser.Options {

    var settings = new Settings(localStorage);
    
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

    document.addEventListener('DOMContentLoaded', () => initialize());
}