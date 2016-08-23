

module UrlEditor {

    function isCharacterKeyPress(evt) {
        if (typeof evt.which == "undefined") {
            // This is IE, which only fires keypress events for printable keys
            return true;
        } else if (typeof evt.which == "number" && evt.which > 0) {
            // In other browsers except old versions of WebKit, evt.which is
            // only greater than zero if the keypress is a printable key.
            // We need to filter out backspace and ctrl/alt/meta key combinations
            return !evt.ctrlKey && !evt.metaKey && !evt.altKey;
        }
        return false;
    }

    function initialize() {
        var version = chrome.runtime.getManifest().version;
        var settings = new Settings(localStorage);

        // it is better to set variable before page view event (init)
        Tracking.setCustomDimension(Tracking.Dimension.Version, version);

        Tracking.init(settings.trackingEnabled);

        var versionElem = ge("version");
        versionElem.textContent = "UrlEditor PRO v" + version;
        !settings.trackingEnabled && (versionElem.style.color = "red");

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