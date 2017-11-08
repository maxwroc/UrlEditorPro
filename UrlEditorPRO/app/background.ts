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

    // clearing context menu
    //chrome.webRequest.onBeforeRequest.addListener(() => chrome.contextMenus.removeAll(), { urls: ["*"] });

    let redirect = new RedirectionManager(new Settings(localStorage));
    redirect.initOnBeforeRequest((urlFilter, name, handler, infoSpec) => {
        chrome.webRequest.onBeforeRequest.addListener(r => {
           return handler(r, false);
            /*
            chrome.contextMenus.create({
                title: "Redirect: " + name,
                contexts: ["browser_action"],
                onclick: () => handler(r, true)
            });
            */
        }, { urls: [urlFilter] }, infoSpec);
    });
}
