
///<reference path="../shared/autosuggest.shared.ts" />
///<reference path="../modules/helpers.ts" />
///<reference path="../modules/redirection.ts" />

module UrlEditor.Options.Redirection {
    let settings: Settings;

    let editElems = {
        testUrl: <HTMLTextAreaElement>null,
        resultUrl: <HTMLTextAreaElement>null,
        urlFilter: <HTMLInputElement>null,
        isAutomatic: <HTMLInputElement>null,
        hotKey: <HTMLInputElement>null,
        protocol: <HTMLInputElement>null,
        hostname: <HTMLInputElement>null,
        port: <HTMLInputElement>null,
        submit: <HTMLInputElement>null,
        addParam: <HTMLInputElement>null,
        addReplaceString: <HTMLInputElement>null
    }

    let edit_testUrlElem: HTMLTextAreaElement;
    let edit_filterElem: HTMLInputElement;

    export function init(setts: Settings) {
        settings = setts;
        let redirectionsModule = Helpers.ge("redirectionsModule");
        redirectionsModule.addEventListener("click", handleClick);
        redirectionsModule.addEventListener("input", handleChange);

        populateEditElements("redirection_edit");
    }

    function handleClick(evt: Event) {
        switch (evt.target) {
            case editElems.addParam:
                addDoubleInputFields(editElems.addParam);
                break;
            case editElems.addReplaceString:
                addDoubleInputFields(editElems.addReplaceString);
                break;
        }
    }

    function handleChange(evt: Event) {
        validateEditFields();
    }

    function addDoubleInputFields(elem: HTMLInputElement) {
        let newRow = document.createElement("div");
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
        })
        newRow.appendChild(nullBtn);

        let rowContainer = elem.parentElement.parentElement;
        let button = document.createElement("input") as HTMLInputElement;
        button.type = "button";
        button.value = "-";
        button.className = "small";
        button.addEventListener("click", () => rowContainer.removeChild(newRow));

        newRow.appendChild(button);
        rowContainer.insertBefore(newRow, elem.parentElement.nextElementSibling);
    }

    function validateEditFields() {
        let validator = new Validator("errorMessages");
        if (!validator.isNotEmpty(editElems.urlFilter)) {
            return;
        }

        validator.isNumber(editElems.port);

        if (editElems.testUrl.value != "") {
            let redir = new RedirectRule(getReplaceData());

            if (validator.isValidCustom(
                editElems.urlFilter,
                () => redir.isUrlSupported(editElems.testUrl.value),
                "Filter is not passing on given test url")) {

                editElems.resultUrl.textContent = redir.getUpdatedUrl(editElems.testUrl.value);
            }

        }

        editElems.submit.disabled = !validator.isValid;
    }

    function getReplaceData(): IRedirectReplaceData {
        let result: IRedirectReplaceData = { urlFilter: "" };
        ["urlFilter", "isAutomatic", "hotKey", "protocol", "hostname", "port"].forEach(e => {
            let value = null;
            if (editElems[e].type == "checkbox") {
                result[e] = !!editElems[e].checked;
            }
            else {
                if (editElems[e].value != "") {
                    result[e] = editElems[e].value;
                }
            }
        });

        return result;
    }

    function populateEditElements(parentId: string) {
        let container = Helpers.ge(parentId);
        let resultNodes = container.querySelectorAll("textarea, input");
        let editElementsNames = Object.keys(editElems);
        for (let i = 0, field: HTMLInputElement; field = <HTMLInputElement>resultNodes[i]; i++) {
            if (editElementsNames.indexOf(field.name) != -1) {
                editElems[field.name] = field;
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