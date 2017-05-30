﻿/// <reference path="modules/autosuggest.ts" />
/// <reference path="modules/rich_textbox.ts" />
/// <reference path="modules/settings.ts" />
/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/view_model.ts" />
/// <reference path="../../typings/index.d.ts" />

module UrlEditor {

    function initialize() {
        var version = chrome.runtime.getManifest().version;
        var settings = new Settings(localStorage);

        // it is better to set variable before page view event (init)
        Tracking.setCustomDimension(Tracking.Dimension.Version, version);

        Tracking.init(settings.trackingEnabled);
        new RichTextboxViewModel(document);

        var versionElem = Helpers.ge("version");
        versionElem.textContent = "UrlEditor PRO v" + version;
        !settings.trackingEnabled && (versionElem.style.color = "red");

        // get currently selected tab
        chrome.tabs.getSelected(null, function (tab) {
            
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

        });
    };
    
    document.addEventListener('DOMContentLoaded', () => initialize());
}