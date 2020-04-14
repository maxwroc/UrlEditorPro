
///<reference path="../shared/autosuggest.shared.ts" />
///<reference path="../modules/helpers.ts" />
///<reference path="../modules/redirection.ts" />
///<reference path="redirection/ruleeditor.ts" />

module UrlEditor.Options.Redirection {
    let settings: Settings;
    let redirManager: RedirectionManager;
    let ruleEditor: RuleEditor;

    let editElems = {
        redirectionsModule: <HTMLDivElement>null,
        rulesList: <HTMLUListElement>null,
        addRule: <HTMLInputElement>null
    }

    export function init(setts: Settings) {
        settings = setts;
        editElems.redirectionsModule = Helpers.ge("redirectionsModule");
        editElems.redirectionsModule.addEventListener("click", handleClick);

        redirManager = new RedirectionManager(setts);
        editElems.rulesList = Helpers.ge("rules_list");

        ruleEditor = new RuleEditor(redirManager, () => populateRulesList());

        populateRulesList();
    }

    function handleClick(evt: Event) {
        let evtTarget = evt.target as HTMLInputElement;
        if (evtTarget.tagName != "INPUT") {
            return;
        }

        switch (evtTarget.name) {
            case "addRule":
                ruleEditor.open();
                break;
            case "addRuleRegEx":
                ruleEditor.open(null, true/*advanced*/);
        }
    }

    function populateRulesList() {
        let data = redirManager.getData();
        editElems.rulesList.innerHTML = "";
        Object.keys(data).forEach(name => {
            let ruleData = data[name];

            let li = document.createElement("li");

            if (ruleData.disabledReason) {
                li.setAttribute("class", "disabled");
            }

            let nameElem = document.createElement("div");
            nameElem.textContent = name;
            nameElem.title = nameElem.textContent;
            li.appendChild(nameElem);

            let filterElem = document.createElement("div");
            filterElem.textContent = ruleData.urlFilter;
            filterElem.title = filterElem.textContent;
            li.appendChild(filterElem);

            li.addEventListener("click", evt => {
                // prevent from calling the regular handler
                evt.stopPropagation();

                ruleEditor.open(ruleData);
            })

            editElems.rulesList.appendChild(li);
        });
    }
}