/// <reference path="modules/url_parser.ts" />
/// <reference path="../../typings/index.d.ts" />

module UrlEditor {
    chrome.commands.onCommand.addListener(command => {
        if (command == "goToHomepage") {
            chrome.tabs.getSelected(null, function (tab) {
                var uri = new UrlEditor.Uri(tab.url);
                chrome.tabs.update(tab.id, { url: uri.protocol() + "//" + uri.host() });
            });
        }
    });
}