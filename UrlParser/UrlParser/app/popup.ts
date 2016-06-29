declare var chrome;

module UrlParser {

    function ge(id: string): HTMLElement {
        return document.getElementById(id);
    }

    function populateBasicFields(url: Uri) {
        (<HTMLTextAreaElement>ge("full_url")).value = url.url();
        (<HTMLTextAreaElement>ge("hostname")).value = url.hostname();
        (<HTMLInputElement>ge("path")).value = url.pathname();
    }

    function populateParams(url: Uri) {

        var params = document.getElementById("params");
        params.innerHTML = "";

        var urlParams = url.params();
        for (var name in urlParams) {
            var param = <HTMLDivElement>document.createElement("div");
            param.className = "param";
            param["param-name"] = name;
            param.innerHTML = '<input type="text" class="name" /> <input type="text" class="value" /> <input type="checkbox" /> <input type="button" value="x" />';

            var paramNameElem = <HTMLInputElement>param.firstElementChild;
            paramNameElem.value = name;

            var paramValue = <HTMLInputElement>paramNameElem.nextElementSibling;
            paramValue.value = urlParams[name];

            params.appendChild(param);
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

            ge("full_url").addEventListener("keyup", evt => {
                url.url(evt.currentTarget["value"]);
                populateBasicFields(url);
                populateParams(url);
            });

            ge("params").addEventListener("keyup", evt => {

                if (evt.keyCode == 13) {
                    return submit();
                }

                var c = <HTMLInputElement>evt.target;
                if (c.tagName == "INPUT" && c.type == "text" && c.parentElement["param-name"]) {
                    switch (c.className) {
                        case "name":
                            var origName = c.parentElement["param-name"];
                            var params = url.params();
                            var value = params[origName];
                            // remove parameter from the list
                            delete params[origName];
                            // readding it with new name
                            params[c.value] = value;
                            url.params(params);

                            c.parentElement["param-name"] = c.value;
                            populateBasicFields(url);
                            break;
                        case "value":
                            var params = url.params();
                            params[c.parentElement["param-name"]] = c.nextElementSibling["checked"] ? encodeURIComponent(c.value) : c.value;
                            url.params(params);

                            populateBasicFields(url);
                            break;
                    }
                }
            });

            ge("params").addEventListener("click", evt => {
                var elem = <HTMLElement>evt.target;
                if (elem.tagName == "INPUT") {
                    var inputElem = <HTMLInputElement>elem;
                    switch (inputElem.type) {
                        case "checkbox":
                            var valElem = <HTMLInputElement>inputElem.previousElementSibling;

                            if (inputElem["checked"]) {
                                valElem.value = decodeURIComponent(valElem.value);
                            }
                            else {
                                valElem.value = encodeURIComponent(valElem.value);
                            }
                            break;
                    }
                }
            });

            ge("go").addEventListener("click", () => submit());
        });
    };
    
    document.addEventListener('DOMContentLoaded', () => initialize());
}