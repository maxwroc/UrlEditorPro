/// <reference path="modules/autosuggest.ts" />
/// <reference path="modules/rich_textbox.ts" />
/// <reference path="modules/settings.ts" />
/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/view_model.ts" />
/// <reference path="../../typings/index.d.ts" />
/// <reference path="shared/shared.ts" />

module UrlEditor {

    function initialize(storage: Storage) {
        var version = chrome.runtime.getManifest().version;
        var settings = new Settings(storage);

        // it is better to set variable before page view event (init)
        Tracking.setCustomDimension(Tracking.Dimension.Version, version);

        Tracking.init(settings.trackingEnabled, "/popup.html", true, version);
        new RichTextboxViewModel(document);

        var versionElem = Helpers.ge("version");
        versionElem.textContent = "UrlEditor PRO v" + version;
        !settings.trackingEnabled && (versionElem.style.color = "red");

        if (settings.debugMode) {
            let log = document.createElement("pre");
            log.id = "log";
            document.body.appendChild(log);
        }

        // get currently selected tab
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {

            var tab = tabs[0];
            var uri = new UrlEditor.Uri(tab.url);

            var autosuggest = new AutoSuggest(settings, document, uri, tab.incognito);

            new UrlEditor.ViewModel(uri, document, settings, (uri, openIn) => {

                switch (openIn) {
                    case OpenIn.CurrentTab:
                        chrome.tabs.update(tab.id, { url: uri.url() });
                        break;
                    case OpenIn.NewTab:
                        chrome.tabs.create({ url: uri.url() });
                        break;
                    case OpenIn.NewWindow:
                        chrome.windows.create({ url: uri.url() });
                        break;
                }

                autosuggest.onSubmission(uri);

                // check if we should close extension popup/action pane
                if (settings.autoHide) {
                    // delay closing popup a bit to make sure tracking data is flushed
                    setTimeout(() => window.close(), 500);
                }
            });

            Plugins.ViewModel.forEach(plugin => new plugin(settings, this));
        });
    };

    // to enable UI testing
    document.addEventListener(
        window.top == window.self && !window["__karma__"] ? "DOMContentLoaded" : "init",
        (evt: any) => initialize(<Storage>evt.detail || localStorage));
}

