// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.getSelected(null, function (tab) {
        var content = document.getElementById("full_url");
        content.value = JSON.stringify(UrlParser.parseUrl(tab.url));
    });
});
