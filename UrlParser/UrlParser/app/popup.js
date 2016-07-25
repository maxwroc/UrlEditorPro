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
        chrome.tabs.getSelected(null, function (tab) {
            var settings = new UrlEditor.Settings(localStorage);
            var uri = new UrlEditor.Uri(tab.url);
            var autosuggest = new UrlEditor.AutoSuggest(settings, document, uri);
            new UrlEditor.ViewModel(uri, document, function (uri) {
                // redirect current tab
                chrome.tabs.update(tab.id, { url: uri.url() });
                autosuggest.onSubmission(uri);
                // check if we should close extension popup/action pane
                if (settings.autoHide) {
                    window.close();
                }
            });
        });
    }
    ;
    document.addEventListener('DOMContentLoaded', function () { return initialize(); });
})(UrlEditor || (UrlEditor = {}));
