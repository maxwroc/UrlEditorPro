var UrlEditor;
(function (UrlEditor) {
    function isCharacterKeyPress(evt) {
        if (typeof evt.which == "undefined") {
            // This is IE, which only fires keypress events for printable keys
            return true;
        }
        else if (typeof evt.which == "number" && evt.which > 0) {
            // In other browsers except old versions of WebKit, evt.which is
            // only greater than zero if the keypress is a printable key.
            // We need to filter out backspace and ctrl/alt/meta key combinations
            return !evt.ctrlKey && !evt.metaKey && !evt.altKey;
        }
        return false;
    }
    function initialize() {
        var settings = new UrlEditor.Settings(localStorage);
        UrlEditor.Tracking.init(settings.trackingEnabled);
        chrome.tabs.getSelected(null, function (tab) {
            var uri = new UrlEditor.Uri(tab.url);
            var autosuggest = new UrlEditor.AutoSuggest(settings, document, uri, tab.incognito);
            new UrlEditor.ViewModel(uri, document, settings, function (uri) {
                // redirect current tab
                chrome.tabs.update(tab.id, { url: uri.url() });
                autosuggest.onSubmission(uri);
                // check if we should close extension popup/action pane
                if (settings.autoHide) {
                    // delay closing popup a bit to make sure tracking data is flushed
                    setTimeout(function () { return window.close(); }, 500);
                }
            });
        });
    }
    ;
    document.addEventListener('DOMContentLoaded', function () { return initialize(); });
})(UrlEditor || (UrlEditor = {}));
