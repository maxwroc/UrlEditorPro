///<reference path="../validator.ts" />

module UrlEditor.Options.Redirection {
    let elems = {
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
        path: <HTMLInputElement>null,
        addParam: <HTMLInputElement>null,
        addReplaceString: <HTMLInputElement>null,

        regExp: <HTMLInputElement>null,
        isRegExpGlobal: <HTMLInputElement>null,
        replaceString: <HTMLInputElement>null,

        submit: <HTMLInputElement>null,
        deleteRule: <HTMLInputElement>null,
        cancel: <HTMLInputElement>null,
        slider: <HTMLDivElement>null,
        errorMessages: <HTMLDivElement>null
    };

    const commonFileds = ["name", "urlFilter", "isAutomatic"];
    const simpleRuleFields = ["hotKey", "protocol", "hostname", "port", "path"];

    export class RuleEditor {

        private ruleData?: IRedirectionRuleData;
        private validator?: Validator;
        private isAdvanced: boolean;

        constructor(private manager: RedirectionManager, private onSave: () => void) {

        }

        open(ruleData?: IRedirectionRuleData, advanced = false) {

            if (!elems.name) {
                this.initializeStaticFields();
            }

            if (advanced || (ruleData && (ruleData as IRegExpRuleData).regExp)) {
                elems.container.classList.add("adv");
                this.isAdvanced = true;
            }

            this.ruleData = ruleData;

            if (this.ruleData) {
                this.populateFormFields(this.ruleData);
            }

            elems.slider.style.left = "-100%";
            elems.deleteRule.disabled = !this.ruleData;
        }

        close() {
            this.clearFields();
            elems.slider.style.left = "";
        }

        save(deleteCurrentRule = false) {
            this.manager.save(deleteCurrentRule ? null : this.getReplaceData(), this.ruleData ? this.ruleData.name : null);
            this.close();
            this.onSave();
            chrome.runtime.sendMessage(Command.ReloadRedirectionRules);
        }

        private handleClick(evt: Event) {
            switch ((<HTMLInputElement>evt.target).name) {
                case "addParam":
                    this.addDoubleInputFields(elems.addParam, "params");
                    break;
                case "addReplaceString":
                    this.addDoubleInputFields(elems.addReplaceString, "strings");
                    break;
                case "cancel":
                    this.close();
                    break;
                case "submit":
                    this.save();
                    break;
                case "deleteRule":
                    this.save(true/*deleteCurrentRule*/);
                    break;
            }

            evt.stopPropagation();
        }

        private handleChange(evt: Event) {
            evt.stopPropagation();

            this.validateEditFields();
        }

        private initializeStaticFields() {
            elems.container = Helpers.ge("rules_editor");
            let resultNodes = elems.container.querySelectorAll("textarea, input");
            let editElementsNames = Object.keys(elems);
            for (let i = 0, field: HTMLInputElement; field = <HTMLInputElement>resultNodes[i]; i++) {
                if (editElementsNames.indexOf(field.name) != -1) {
                    elems[field.name] = field;
                }
            }

            elems.slider = elems.container.parentElement as HTMLDivElement;
            elems.errorMessages = Helpers.ge("errorMessages");

            elems.hotKey.addEventListener("keydown", evt => this.handleHotKeyAssignment(evt));
            elems.container.addEventListener("click", evt => this.handleClick(evt));
            elems.container.addEventListener("input", evt => this.handleChange(evt));
        }

        private clearFields() {
            this.ruleData = null;

            commonFileds.concat(simpleRuleFields).forEach(name => {
                if (elems[name].checked === true) {
                    elems[name].checked = false;
                }

                elems[name].value = "";
            });

            elems.errorMessages.innerHTML = "";
            elems.submit.disabled = true;

            if (this.isAdvanced) {
                let row = elems.regExp.parentElement.previousElementSibling;
                while (row.nextElementSibling) {
                    let input = row.nextElementSibling.getElementsByTagName("input")[0];
                    input.value = "";
                    if (row.nextElementSibling.classList.contains("replace_groups")) {
                        row.parentElement.removeChild(row.nextElementSibling);
                    }
                    else {
                        row = row.nextElementSibling as HTMLElement;
                    }
                }

                this.isAdvanced = false;
                elems.container.classList.remove("adv");
            }
            else {
                elems.container.querySelectorAll(".params").forEach(e => e.parentElement.removeChild(e));
                elems.container.querySelectorAll(".strings").forEach(e => e.parentElement.removeChild(e));
            }

            if (this.validator) {
                // remove all plugins
                this.validator.clear();
            }
        }

        private populateFormFields(ruleData: IRedirectionRuleData | IRegExpRuleData) {
            let regExpRuleAlias = ruleData as IRegExpRuleData;
            let redirRuleAlias = ruleData as IRedirectionRuleData;

            let fieldsToPopulate = simpleRuleFields.concat(commonFileds);

            if (this.isAdvanced) {
                fieldsToPopulate.push("regExp", "isRegExpGlobal", "replaceString");
            }

            // populate basic fields
            fieldsToPopulate.forEach(name => {
                if (ruleData[name] != undefined) {
                    if (elems[name].type == "checkbox") {
                        elems[name].checked = ruleData[name];
                    }
                    else {
                        elems[name].value = ruleData[name];
                    }
                }
                else {
                    // clear field
                    if (elems[name].type == "checkbox") {
                        elems[name].checked = false;
                    }
                    else {
                        elems[name].value = "";
                    }
                }
            });

            if (this.isAdvanced) {
                if (regExpRuleAlias.replaceValues) {
                    this.getGroupReplacementDataAndUpdateFields(regExpRuleAlias);
                }
            }
            else {
                // get param replacement fields
                if (redirRuleAlias.paramsToUpdate) {
                    Object.keys(redirRuleAlias.paramsToUpdate).forEach(name =>
                        this.addDoubleInputFields(elems.addParam, "params", name, redirRuleAlias.paramsToUpdate[name]));
                }

                // get string replace fields
                if (redirRuleAlias.strReplace) {
                    redirRuleAlias.strReplace.forEach(replaceSet =>
                        this.addDoubleInputFields(elems.addReplaceString, "strings", replaceSet[0], replaceSet[1]));
                }
            }
        }

        private getRegExpRuleData(): IRegExpRuleData {
            let result: IRegExpRuleData = {
                name: "",
                urlFilter: "",
                regExp: elems.regExp.value,
                isRegExpGlobal: elems.isRegExpGlobal.checked
            };

            commonFileds.forEach(e => {
                let value = null;
                if (elems[e].type == "checkbox") {
                    result[e] = !!elems[e].checked;
                }
                else {
                    if (elems[e].value != "") {
                        result[e] = elems[e].value;
                    }
                }
            });

            let regExpElem = elems.regExp;

            if (document.activeElement == regExpElem || // if someone is editing regex rule
                // or changing replace values or saves
                ["groupVal", "replaceString", "submit"].indexOf(document.activeElement.getAttribute("name")) != -1) {
                result.replaceValues = this.getGroupReplacementDataAndUpdateFields(result);
            }

            if (elems.replaceString.value != "") {
                result.replaceString = elems.replaceString.value;
            }

            return result;
        }

        private getGroupReplacementDataAndUpdateFields(ruleData: IRegExpRuleData): IGroupReplaceValue[] {
            let regExpElem = elems.regExp;
            let rowGroupValElem = regExpElem.parentElement;
            let result: IGroupReplaceValue[];

            let r = new RegExpGroupReplacer(ruleData.regExp, ruleData.isRegExpGlobal);
            // check if we should add fields
            if (r.groupsCount > 0) {

                result = result || [];

                for (let i = 0; i < r.groupsCount; i++) {

                    // if there is no next element we need to create it
                    if (!rowGroupValElem.nextElementSibling ||
                        // if the next one is not correct type
                        !rowGroupValElem.nextElementSibling.classList.contains("replace_groups")) {

                        let funcName: string;
                        let funcArg: string;
                        if (ruleData.replaceValues && ruleData.replaceValues[i]) {
                            funcName = ruleData.replaceValues[i].func;
                            funcArg = ruleData.replaceValues[i].val;
                        }

                        let newRow = document.createElement("div");
                        newRow.className = "advanced replace_groups";
                        newRow.innerHTML = `
                        <label>Value</label>
                        <select name="groupFunc">
                            ${this.getGroupFunctionOptions(funcName)}
                        </select>
                        <input type="text" name="groupVal" value="${funcArg}" />`;
                        this.insertAfter(rowGroupValElem.parentElement, newRow, rowGroupValElem);
                        rowGroupValElem = newRow;

                        result.push({ func: "replaceWith", val: ""});
                    }
                    else {
                        rowGroupValElem = rowGroupValElem.nextElementSibling as HTMLElement;

                        // add form values to data obj
                        result.push({
                            func: rowGroupValElem.children[1]["value"] as string,
                            val: rowGroupValElem.children[2]["value"] as string
                        });
                    }
                }
            }

            // remove redundant fields
            while (rowGroupValElem.nextElementSibling && rowGroupValElem.nextElementSibling.classList.contains("replace_groups")) {
                rowGroupValElem.parentElement.removeChild(rowGroupValElem.nextElementSibling);
            }

            return result;
        }

        private getGroupFunctionOptions(selectedFunction?: string) {
            return Object.keys(RedirectRule.converters).reduce(
                (prev, curr, index, arr) => `${prev}<option value="${curr}"${curr == selectedFunction ? " selected" : ""}>${curr}</option>`,
                ""
            );
        }

        private insertAfter(parentElem: HTMLElement, newChild: HTMLElement, refChild: Element) {
            if (refChild.nextElementSibling) {
                parentElem.insertBefore(newChild, refChild.nextElementSibling);
            }
            else {
                parentElem.appendChild(newChild);
            }
        }

        private getReplaceData(): IRuleData {
            if (this.isAdvanced) {
                return this.getRegExpRuleData();
            }

            let result: IRedirectionRuleData = { name: "", urlFilter: "" };
            simpleRuleFields.concat(commonFileds).forEach(e => {
                let value = null;
                if (elems[e].type == "checkbox") {
                    result[e] = !!elems[e].checked;
                }
                else {
                    if (elems[e].value != "") {
                        result[e] = elems[e].value;
                    }
                }
            });

            let paramInputs = elems.container.querySelectorAll(".params input[name='field1'], .params input[name='field2']");
            for (var i = 0; i < paramInputs.length; i += 2) {
                let nameElem = paramInputs[i] as HTMLInputElement
                if (nameElem.value) {
                    let valueElem = paramInputs[i + 1] as HTMLInputElement;
                    result.paramsToUpdate = result.paramsToUpdate || {};
                    result.paramsToUpdate[nameElem.value] = valueElem.disabled ? null : valueElem.value;
                }
            }

            let strReplaceInputs = elems.container.querySelectorAll(".strings input[name='field1'], .strings input[name='field2']");
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
            const pattern = /^(\*|https?|file|ftp):\/\/\/?(\*|\*\.[^.][^\/\/:*?"<>|]+|[^.][^\/\/:*?"<>|]+)(\*$|\/.+)$/;
            this.validator = new Validator(elems.errorMessages);

            if (!this.validator.isNotEmpty(elems.name) || !this.validator.isNotEmpty(elems.urlFilter)) {
                return;
            }

            this.validator.isNumber(elems.port);

            let proceed = this.validator.isValidCustom(
                elems.urlFilter,
                val => pattern.test(val),
                "Invalid filter pattern. Look at: https://developer.chrome.com/extensions/match_patterns");

            if (this.isAdvanced) {
                proceed = this.validator.isNotEmpty(elems.regExp) && proceed;
            }

            if (proceed) {
                let data = this.getReplaceData();

                if (elems.testUrl.value != "") {
                    let redir = new RedirectRule(data);

                    if (this.validator.isValidCustom(
                        elems.urlFilter,
                        () => redir.isUrlSupported(elems.testUrl.value),
                        "Filter is not passing on given test url")) {

                        elems.resultUrl.textContent = redir.getUpdatedUrl(elems.testUrl.value);
                    }
                }
            }

            elems.submit.disabled = !this.validator.isValid;
        }

        private addDoubleInputFields(buttonElem: HTMLInputElement, className: string, field1Val = "", field2Val = "") {
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
            field1.value = field1Val;
            container.appendChild(field1);

            let field2 = document.createElement("input") as HTMLInputElement;
            field2.type = "text";
            field2.name = "field2";
            field2.value = field2Val === null ? "[null]" : field2Val;
            field2.disabled = field2Val === null;
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

            let rowContainer = buttonElem.parentElement.parentElement;
            let button = document.createElement("input") as HTMLInputElement;
            button.type = "button";
            button.value = "-";
            button.className = "small";
            button.addEventListener("click", () => {
                rowContainer.removeChild(newRow);
                this.validateEditFields();
            });

            newRow.appendChild(button);
            rowContainer.insertBefore(newRow, buttonElem.parentElement.nextElementSibling);
        }



        private handleHotKeyAssignment(evt: KeyboardEvent) {
            // we don't want the box to be manually edited
            evt.preventDefault();

            if (evt.keyCode == 8) {
                elems.hotKey.value = "";
            }

            if ((evt.ctrlKey || evt.altKey) && [17, 18].indexOf(evt.keyCode) == -1) {
                let result = "";

                result += evt.ctrlKey ? "Ctrl + " : "";
                result += evt.shiftKey ? "Shift + " : "";
                result += evt.altKey ? "Alt + " : "";

                result += evt.keyCode; //String.fromCharCode(evt.keyCode);

                elems.hotKey.value = result;
            }
        }
    }
}