var UrlParser;
(function (UrlParser) {
    function populateBasicFields(url) {
        document.getElementById("full_url").value = url.url();
        document.getElementById("path").value = url.pathname();
    }
    // Run our kitten generation script as soon as the document's DOM is ready.
    document.addEventListener('DOMContentLoaded', function () {
        chrome.tabs.getSelected(null, function (tab) {
            var url = new UrlParser.Uri(tab.url);
            populateBasicFields(url);
            var params = document.getElementById("params");
            var urlParams = url.params();
            for (var name in urlParams) {
                var param = document.createElement("div");
                param.className = "param";
                param["param-name"] = name;
                param.innerHTML = '<input type="text" class="name" /> <input type="text" class="value" /> <input type="checkbox" /> <input type="button" value="x" />';
                var paramNameElem = param.firstElementChild;
                paramNameElem.value = name;
                var paramValue = paramNameElem.nextElementSibling;
                paramValue.value = urlParams[name];
                params.appendChild(param);
            }
            params.addEventListener("keyup", function (evt) {
                var c = evt.target;
                if (c.tagName == "INPUT" && c.type == "text" && c.parentElement["param-name"]) {
                    switch (c.className) {
                        case "name":
                            break;
                        case "value":
                            var params = url.params();
                            console.log("before", params);
                            params[c.parentElement["param-name"]] = c.value;
                            console.log("after", params);
                            url.params(params);
                            console.log("later", url.params());
                            populateBasicFields(url);
                            break;
                    }
                }
            });
        });
    });
})(UrlParser || (UrlParser = {}));
