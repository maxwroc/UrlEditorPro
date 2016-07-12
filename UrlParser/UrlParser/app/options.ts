
module UrlParser.Options {

    var icons = ["img/edit.png", "img/edit2.png", "img/edit3.png", "img/pencil.png", "img/write.png"];
    
    function initialize() {
    
        var iconsContainer = document.getElementById("icon-list");
        var currentIcon = localStorage["currentIcon"] || icons[0];
        icons.forEach(path => {
            var iconElem = document.createElement("label");
            iconElem.innerHTML = '<li><label><input type="radio" name="icon" value="' + path + '" ' + (currentIcon == path ? 'checked' : '') + '/><span><img src="' + path + '" /></span></label></li>';
            iconsContainer.appendChild(iconElem);
        });
        showHideIconCredits();

        document.body.addEventListener("change", evt => {
            var elem = <HTMLInputElement>evt.target;
            if (elem.tagName == "INPUT") {
                switch (elem.name) {
                    case "icon":
                        chrome.browserAction.setIcon({
                            path: elem.value
                        });
                        localStorage["currentIcon"] = elem.value;

                        showHideIconCredits()
                        break;
                }
            }
        });


        chrome.commands.getAll((commands: any[]) => {
            commands.forEach(command => {
                if (command.name == "_execute_browser_action") {
                    document.getElementById("action-shortcut").innerText = command.shortcut;
                }
            }
        });
    }

    function showHideIconCredits() {
        (<HTMLDivElement>document.getElementById("icon-list").nextElementSibling).style.display = icons.indexOf(localStorage["currentIcon"]) == 0 ? "block" : "none";
    }

    document.addEventListener('DOMContentLoaded', () => initialize());
}