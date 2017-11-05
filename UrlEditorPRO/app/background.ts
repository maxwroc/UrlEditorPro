/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/redirection.ts" />
/// <reference path="../../typings/index.d.ts" />

module UrlEditor {
    chrome.commands.onCommand.addListener(command => {
        if (command == "goToHomepage") {
            chrome.tabs.getSelected(null, function (tab) {
                let uri = new UrlEditor.Uri(tab.url);
                chrome.tabs.update(tab.id, { url: uri.protocol() + "//" + uri.host() });
            });
        }
    });
    
    let redirect = new RedirectionManager(new Settings(localStorage));
    redirect.initOnBeforeRequest((urlFilter, handler, infoSpec) => {
        chrome.webRequest.onBeforeRequest.addListener(r => handler(r), { urls: [urlFilter] }, infoSpec);
    });

    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
          title: "first",
          contexts: ["browser_action"],
          onclick: function() {
            alert('first');
          }
    });
}
