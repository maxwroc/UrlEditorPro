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
            
            var settings = new Settings(localStorage);
        
            new UrlParser.ViewModel(new UrlParser.Uri(tab.url), document, url => {
                // redirect current tab
                chrome.tabs.update(tab.id, { url: url });

                // check if we should close extension popup/action pane
                if (settings.autoHide) {
                    window.close();
                }
            });

        });
    };
    
    document.addEventListener('DOMContentLoaded', () => initialize());
}