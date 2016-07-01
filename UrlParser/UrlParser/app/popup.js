var UrlParser;
(function (UrlParser) {
    function ge(id) {
        return document.getElementById(id);
    }
    function populateBasicFields(url) {
        ge("full_url").value = url.url();
        ge("hostname").value = url.hostname();
        ge("path").value = url.pathname();
    }
    function createNewParamsFields(name) {
        var param = document.createElement("div");
        param.className = "param";
        param["param-name"] = name || "--";
        param.innerHTML = '<input type="text" class="name" /> <input type="text" class="value" /> <input type="checkbox" /> <input type="button" value="x" />';
        return param;
    }
    function populateParams(url) {
        var params = document.getElementById("params");
        params.innerHTML = "";
        var urlParams = url.params();
        for (var name in urlParams) {
            var param = createNewParamsFields(name);
            var paramNameElem = param.firstElementChild;
            paramNameElem.value = name;
            var paramValue = paramNameElem.nextElementSibling;
            paramValue.value = urlParams[name];
            params.appendChild(param);
        }
    }
    function deleteParam(url, name) {
        // remove param
        if (name) {
            var params = url.params();
            delete params[name];
            url.params(params);
        }
    }
    function initialize() {
        chrome.tabs.getSelected(null, function (tab) {
            var url = new UrlParser.Uri(tab.url);
            function submit() {
                chrome.tabs.update(tab.id, { url: url.url() });
            }
            populateBasicFields(url);
            populateParams(url);
            ge("full_url").addEventListener("keyup", function (evt) {
                url.url(evt.currentTarget["value"]);
                populateBasicFields(url);
                populateParams(url);
            });
            ge("params").addEventListener("keyup", function (evt) {
                if (evt.keyCode == 13) {
                    return submit();
                }
                var c = evt.target;
                if (c.tagName == "INPUT" && c.type == "text" && c.parentElement["param-name"]) {
                    switch (c.className) {
                        case "name":
                            var origName = c.parentElement["param-name"];
                            // if name is empty string we need to remove param
                            if (c.value == "") {
                                deleteParam(url, origName);
                            }
                            else {
                                var params = url.params();
                                // it is impossible to raneme property so we need to delete old one and add new one
                                if (params[origName] != undefined) {
                                    // remove parameter from the list
                                    delete params[origName];
                                }
                                // readding it with new name
                                params[c.value] = c.nextElementSibling.value;
                                url.params(params);
                                c.parentElement["param-name"] = c.value;
                            }
                            populateBasicFields(url);
                            break;
                        case "value":
                            // check if it's a temporary param name
                            if (c.parentElement["param-name"] == "--") {
                                // do nothing - we cannot set param without its name
                                return;
                            }
                            var params = url.params();
                            params[c.parentElement["param-name"]] = c.nextElementSibling["checked"] ? encodeURIComponent(c.value) : c.value;
                            url.params(params);
                            populateBasicFields(url);
                            break;
                    }
                }
            });
            ge("params").addEventListener("click", function (evt) {
                var elem = evt.target;
                if (elem.tagName == "INPUT") {
                    var inputElem = elem;
                    switch (inputElem.type) {
                        case "checkbox":
                            var valElem = inputElem.previousElementSibling;
                            if (inputElem["checked"]) {
                                valElem.value = decodeURIComponent(valElem.value);
                            }
                            else {
                                valElem.value = encodeURIComponent(valElem.value);
                            }
                            break;
                        case "button":
                            var paramName = elem.parentElement["param-name"];
                            deleteParam(url, paramName);
                            populateBasicFields(url);
                            populateParams(url);
                            break;
                    }
                }
            });
            ge("add_param").addEventListener("click", function () {
                ge("params").appendChild(createNewParamsFields());
            });
            ge("go").addEventListener("click", function () { return submit(); });
        });
    }
    ;
    document.addEventListener('DOMContentLoaded', function () { return initialize(); });
})(UrlParser || (UrlParser = {}));
