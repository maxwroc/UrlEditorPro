/// <reference path="modules/settings.ts" />
/// <reference path="modules/autosuggest.ts" />
/// <reference path="modules/tracking.ts" />
/// <reference path="options/suggestions.ts" />
/// <reference path="options/redirection.ts" />

module UrlEditor.Options {

    export interface IOnInitializedHandler {
        (settings: Settings): void;
    }

    var settings: Settings;
    var autoSuggestData: IAutoSuggestData;
    let onInitializedHandlers: IOnInitializedHandler[] = [];

    /**
     * Automatically populates input fields if their name matches setting name.
     */
    function initialize(storage: Storage) {

        let version = chrome.runtime.getManifest().version;
        settings = new Settings(storage);

        // it is better to set variable before page view event (init)
        Tracking.setCustomDimension(Tracking.Dimension.Version, version);

        Tracking.init(settings.trackingEnabled, "/options.html", true, version);

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
            "GoToHomepage": "goToHome-shortcut",
            "RedirectUseFirstRule": "redirect-shortcut"
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
        Redirection.init(settings);
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

    document.addEventListener(
        window.top == window.self && !window["__karma__"] ? "DOMContentLoaded" : "init",
        (evt: any) => initialize(<Storage>evt.detail || localStorage));
}