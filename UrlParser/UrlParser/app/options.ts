
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
                        break;
                    case "radio":
                        if (elem.checked) {
                            settings.setValue(elem.name, elem.value);
                        }
                        break;
                }

                // apply setting
                switch (elem.name) {
                    case "icon":
                        chrome.browserAction.setIcon({
                            path: elem.value
                        });
                        toggleCredits();
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
                        break;
                    case "radio":
                        if (input.value == settings[input.name]) {
                            input.checked = true;
                            toggleCredits();
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

    function toggleCredits() {
        (<HTMLDivElement>document.getElementById("icon-credits")).style.display = settings.icon == "img/edit.png" ? "block" : "none";
    }

    document.addEventListener('DOMContentLoaded', () => initialize());
}