/// <reference path="modules/settings.ts" />
/// <reference path="modules/autosuggest.ts" />
/// <reference path="modules/tracking.ts" />

module UrlEditor.Options {

    export interface IOnInitializedHandler {
        (settings: Settings): void;
    }

    var settings = new Settings(localStorage);
    var autoSuggestData: IAutoSuggestData;
    let onInitializedHandlers: IOnInitializedHandler[] = [];

    /**
     * Automatically populates input fields if their name matches setting name.
     */
    function initialize() {
        Tracking.init(settings.trackingEnabled);

        document.body.addEventListener("change", evt => onChangeHandler(evt));
        document.body.addEventListener("click", evt => onClickHandler(evt));

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

        // populate all global commands/shortcuts
        chrome.commands.getAll(commands => {
            commands.forEach(command => {
                if (commandToElemIDMap[command.name]) {
                    document.getElementById(commandToElemIDMap[command.name]).innerText = command.shortcut;
                }
            });
        });

        Suggestions.init(settings);
    }

    function onChangeHandler(evt: Event): void {
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
    }

    function onClickHandler(evt: MouseEvent): void {
        var elem = <HTMLInputElement>evt.target;

        // general click tracking
        if (elem.getAttribute) {
            var trackId = elem.getAttribute("track");
            if (trackId) {
                Tracking.trackEvent(Tracking.Category.Settings, trackId);
            }
        }
    }

    function toggleRelatedElem(elem: HTMLInputElement) {
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

    document.addEventListener('DOMContentLoaded', () => initialize());
}