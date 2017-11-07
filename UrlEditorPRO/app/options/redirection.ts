
///<reference path="../shared/autosuggest.shared.ts" />
///<reference path="../modules/helpers.ts" />
///<reference path="../modules/redirection.ts" />

module UrlEditor.Options.Redirection {
    let settings: Settings;
    let redirManager: RedirectionManager;
    let ruleEditor: RuleEditor;

    let editElems = {
        redirectionsModule: <HTMLDivElement>null,
        rulesList: <HTMLUListElement>null,
        addRule: <HTMLInputElement>null
    }

    let edit_testUrlElem: HTMLTextAreaElement;
    let edit_filterElem: HTMLInputElement;

    export function init(setts: Settings) {
        settings = setts;
        editElems.redirectionsModule = Helpers.ge("redirectionsModule");
        editElems.redirectionsModule.addEventListener("click", handleClick);

        redirManager = new RedirectionManager(setts);
        editElems.rulesList = Helpers.ge("rules_list");

        ruleEditor = new RuleEditor();

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
        }
    }

    function populateRulesList() {
        let data = redirManager.getData();
        Object.keys(data).forEach(name => {
            let li = document.createElement("li");

            let nameElem = document.createElement("div");
            nameElem.textContent = name;
            li.appendChild(nameElem);

            let filterElem = document.createElement("div");
            filterElem.textContent = data[name].urlFilter;
            li.appendChild(filterElem);

            li.addEventListener("click", evt => {
                // prevent from calling the regular handler
                evt.stopPropagation();

                ruleEditor.open(data[name]);
            })

            editElems.rulesList.appendChild(li);
        });
    }

    class RuleEditor {

        static fieldsToApply = ["name", "urlFilter", "isAutomatic", "hotKey", "protocol", "hostname", "port"];
        static elems = {
            container: <HTMLDivElement>null,
            testUrl: <HTMLTextAreaElement>null,
            resultUrl: <HTMLTextAreaElement>null,
            name: <HTMLInputElement>null,
            urlFilter: <HTMLInputElement>null,
            isAutomatic: <HTMLInputElement>null,
            hotKey: <HTMLInputElement>null,
            protocol: <HTMLInputElement>null,
            hostname: <HTMLInputElement>null,
            port: <HTMLInputElement>null,
            submit: <HTMLInputElement>null,
            addParam: <HTMLInputElement>null,
            addReplaceString: <HTMLInputElement>null,
            deleteRule: <HTMLInputElement>null,
            cancel: <HTMLInputElement>null,
            slider: <HTMLDivElement>null
        }

        private ruleData?: IRedirectionRuleData;

        open(ruleData?: IRedirectionRuleData) {

            if (!RuleEditor.elems.name) {
                this.initializeStaticFields();
            }

            this.ruleData = ruleData;
            RuleEditor.elems.slider.style.left = "-100%";
        }

        close() {
            this.clearFields();
            RuleEditor.elems.slider.style.left = "";
        }

        save() {

        }

        private handleClick(evt: Event) {
            switch (evt.target) {
                case RuleEditor.elems.addParam:
                    this.addDoubleInputFields(RuleEditor.elems.addParam, "params");
                    break;
                case RuleEditor.elems.addReplaceString:
                    this.addDoubleInputFields(RuleEditor.elems.addReplaceString, "strings");
                    break;
                case RuleEditor.elems.cancel:
                    this.close();
                    break;
            }

            evt.stopPropagation();
        }

        private handleChange(evt: Event) {
            evt.stopPropagation();

            this.validateEditFields();
        }

        private initializeStaticFields() {
            RuleEditor.elems.container = Helpers.ge("rules_editor");
            let resultNodes = RuleEditor.elems.container.querySelectorAll("textarea, input");
            let editElementsNames = Object.keys(RuleEditor.elems);
            for (let i = 0, field: HTMLInputElement; field = <HTMLInputElement>resultNodes[i]; i++) {
                if (editElementsNames.indexOf(field.name) != -1) {
                    RuleEditor.elems[field.name] = field;
                }
            }

            RuleEditor.elems.slider = RuleEditor.elems.container.parentElement as HTMLDivElement;

            RuleEditor.elems.hotKey.addEventListener("keydown", evt => this.handleHotKeyAssignment(evt));
            RuleEditor.elems.container.addEventListener("click", evt => this.handleClick(evt));
            RuleEditor.elems.container.addEventListener("input", evt => this.handleChange(evt));
        }

        private clearFields() {
            this.ruleData = null;
        }

        private populateFields() {
            // populate basic fields
            RuleEditor.fieldsToApply.forEach(name => {
                if (this.ruleData[name] != undefined) {
                    if (RuleEditor.elems[name].type == "checkbox") {
                        RuleEditor.elems[name].checked = this.ruleData[name];
                    }
                    else {
                        RuleEditor.elems[name] = this.ruleData[name];
                    }
                }
            });

            if (this.ruleData.paramsToUpdate) {

            }

            if (this.ruleData.strReplace) {

            }
        }

        private getReplaceData(): IRedirectionRuleData {
            let result: IRedirectionRuleData = { name: "", urlFilter: "" };
            RuleEditor.fieldsToApply.forEach(e => {
                let value = null;
                if (RuleEditor.elems[e].type == "checkbox") {
                    result[e] = !!RuleEditor.elems[e].checked;
                }
                else {
                    if (RuleEditor.elems[e].value != "") {
                        result[e] = RuleEditor.elems[e].value;
                    }
                }
            });

            let paramInputs = RuleEditor.elems.container.querySelectorAll(".params input[name='field1'], .params input[name='field2']");
            for (var i = 0; i < paramInputs.length; i += 2) {
                let nameElem = paramInputs[i] as HTMLInputElement
                if (nameElem.value) {
                    let valueElem = paramInputs[i + 1] as HTMLInputElement;
                    result.paramsToUpdate = result.paramsToUpdate || {};
                    result.paramsToUpdate[nameElem.value] = valueElem.disabled ? null : valueElem.value;
                }
            }

            let strReplaceInputs = RuleEditor.elems.container.querySelectorAll(".strings input[name='field1'], .strings input[name='field2']");
            for (var i = 0; i < strReplaceInputs.length; i += 2) {
                let nameElem = strReplaceInputs[i] as HTMLInputElement
                if (nameElem.value) {
                    let valueElem = strReplaceInputs[i + 1] as HTMLInputElement;
                    result.strReplace = result.strReplace || [];
                    result.strReplace.push([nameElem.value, valueElem.value]);
                }
            }

            return result;
        }

        private validateEditFields() {
            let validator = new Validator("errorMessages");
            if (!validator.isNotEmpty(RuleEditor.elems.name) || !validator.isNotEmpty(RuleEditor.elems.urlFilter)) {
                return;
            }

            validator.isNumber(RuleEditor.elems.port);

            if (RuleEditor.elems.testUrl.value != "") {
                let redir = new RedirectRule(this.getReplaceData());

                if (validator.isValidCustom(
                    RuleEditor.elems.urlFilter,
                    () => redir.isUrlSupported(RuleEditor.elems.testUrl.value),
                    "Filter is not passing on given test url")) {

                        RuleEditor.elems.resultUrl.textContent = redir.getUpdatedUrl(RuleEditor.elems.testUrl.value);
                }

            }

            RuleEditor.elems.submit.disabled = !validator.isValid;
        }

        private addDoubleInputFields(elem: HTMLInputElement, className: string) {
            let newRow = document.createElement("div");
            newRow.className = className;

            let label = document.createElement("label");
            label.style.visibility = "hidden";
            newRow.appendChild(label);

            let container = document.createElement("div");
            container.className = "split-half";

            let field1 = document.createElement("input") as HTMLInputElement;
            field1.type = "text";
            field1.name = "field1";
            container.appendChild(field1);

            let field2 = document.createElement("input") as HTMLInputElement;
            field2.type = "text";
            field2.name = "field2";
            container.appendChild(field2);

            newRow.appendChild(container);

            let nullBtn = document.createElement("input") as HTMLInputElement;
            nullBtn.type = "button";
            nullBtn.value = "null";
            nullBtn.className = "small";
            nullBtn.addEventListener("click", () => {
                if (field2.disabled) {
                    field2.disabled = false;
                    field2.value = "";
                }
                else {
                    field2.disabled = true;
                    field2.value = "[null]";
                }
                this.validateEditFields();
            })
            newRow.appendChild(nullBtn);

            let rowContainer = elem.parentElement.parentElement;
            let button = document.createElement("input") as HTMLInputElement;
            button.type = "button";
            button.value = "-";
            button.className = "small";
            button.addEventListener("click", () => {
                rowContainer.removeChild(newRow);
                this.validateEditFields();
            });

            newRow.appendChild(button);
            rowContainer.insertBefore(newRow, elem.parentElement.nextElementSibling);
        }



        private handleHotKeyAssignment(evt: KeyboardEvent) {
            // we don't want the box to be manually edited
            evt.preventDefault();

            if (evt.keyCode == 8) {
                RuleEditor.elems.hotKey.value = "";
            }

            if ((evt.ctrlKey || evt.altKey) && [17, 18].indexOf(evt.keyCode) == -1) {
                let result = "";

                result += evt.ctrlKey ? "Ctrl + " : "";
                result += evt.shiftKey ? "Shift + " : "";
                result += evt.altKey ? "Alt + " : "";

                result += evt.keyCode; //String.fromCharCode(evt.keyCode);

                RuleEditor.elems.hotKey.value = result;
            }
        }
    }

    class Validator {

        public isValid = true;
        public errorMessages: string[] = [];
        private outputElem: HTMLDivElement;

        constructor(output?: string | HTMLDivElement) {
            this.outputElem = typeof (output) == "string" ? Helpers.ge(output) : output;

            if (this.outputElem) {
                this.outputElem.textContent = "";
            }
        }

        isNotEmpty(elem: HTMLInputElement | HTMLTextAreaElement, mark = true): boolean {
            return this.isValidCustom(
                elem,
                () => elem.value != "",
                `Field "${elem.previousSibling.textContent}" cannot be empty.`,
                mark);
        }

        isNumber(elem: HTMLInputElement | HTMLTextAreaElement, allowEmptyVal = true, mark = true) {
            let parsedVal = parseInt(elem.value);
            return this.isValidCustom(
                elem,
                () => (elem.value == "" && allowEmptyVal) || parsedVal.toString() == elem.value,
                `Field "${elem.previousSibling.textContent}" is not a number.`,
                mark);
        }

        isValidCustom(elem: HTMLInputElement | HTMLTextAreaElement, isValid: () => boolean, errorMessage: string, mark = true) {
            let valid = isValid();
            if (mark) {
                if (valid) {
                    elem.classList.remove("not_valid");
                }
                else {
                    elem.classList.add("not_valid")
                }
            }

            if (!valid) {
                this.addError(errorMessage);
            }

            if (!valid) {
                this.isValid = false;
            }

            return valid;
        }

        private addError(msg: string) {
            this.errorMessages.push(msg);

            if (this.outputElem) {
                if (this.outputElem.textContent) {
                    msg = "\n" + msg;
                }

                this.outputElem.textContent += msg;
            }
        }
    }
}