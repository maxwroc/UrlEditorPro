// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.getSelected(null, function (tab) {
        var content = document.getElementById("full_url");
        var url = new UrlParser.Uri(tab.url);
        content.value = url.url();
        document.getElementById("path").value = url.pathname();
        var params = document.getElementById("params");
        var urlParams = url.params();
        for (var name in urlParams) {
            var param = document.createElement("div");
            param.className = "param";
            param.innerHTML = '<input type="text" /> <input type="text" class="value" /> <input type="checkbox" /> <input type="button" value="x" />';
            var paramNameElem = param.firstElementChild;
            paramNameElem.value = name;
            var paramValue = paramNameElem.nextElementSibling;
            paramValue.value = urlParams[name];
            params.appendChild(param);
        }
    });
});
