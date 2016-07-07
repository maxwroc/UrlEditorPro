
module UrlParser.Options {
    
    function initialize() {
    
        var icons = ["img/edit.png", "img/edit2.png", "img/edit3.png", "img/pencil.png", "img/write.png"];
        var iconsContainer = document.getElementById("icon-list");
        var currentIcon = localStorage["currentIcon"] || icons[0];
        icons.forEach(path => {
            var iconElem = document.createElement("label");
            iconElem.innerHTML = '<li><label><input type="radio" name="icon" value="' + path + '" ' + (currentIcon == path ? 'checked' : '') + '/><span><img src="' + path + '" /></span></label></li>';
            iconsContainer.appendChild(iconElem);
        });

        document.body.addEventListener("change", evt => {
            var elem = <HTMLInputElement>evt.target;
            if (elem.tagName == "INPUT") {
                switch (elem.name) {
                    case "icon":
                        chrome.browserAction.setIcon({
                            path: elem.value
                        });
                        localStorage["currentIcon"] = elem.value;
                        break;
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => initialize());
}