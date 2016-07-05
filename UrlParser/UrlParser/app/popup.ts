declare var chrome;

module UrlParser {

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
        chrome.tabs.getSelected(null, function (tab) {
        
            new UrlParser.ViewModel(new UrlParser.Uri(tab.url), document, url => {
                chrome.tabs.update(tab.id, { url: url });
            });

        });
    };
    
    document.addEventListener('DOMContentLoaded', () => initialize());
}