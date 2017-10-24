
///<reference path="../shared/autosuggest.shared.ts" />
///<reference path="../modules/helpers.ts" />
///<reference path="../modules/redirection.ts" />

module UrlEditor.Options.Redirection {
    let settings: Settings;

    let editElems = {
        testUrl: <HTMLTextAreaElement>null,
        urlFilter: <HTMLInputElement>null,
        isAutomatic: <HTMLInputElement>null,
        hotKey: <HTMLInputElement>null,
        protocol: <HTMLInputElement>null,
        hostName: <HTMLInputElement>null,
        port: <HTMLInputElement>null,
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

    function handleClick() {

    }

    function handleChange(evt: Event) {
        let validator = new Validator("errorMessages");
        if (!validator.isNotEmpty(editElems.testUrl) ||
            !validator.isNotEmpty(editElems.urlFilter)) {
            return;
        }

        let redir = new RedirectRule(getReplaceData());

        if (!validator.isValidCustom(
            editElems.urlFilter,
            () => redir.isUrlSupported(editElems.testUrl.value),
            "Filter is not passing on given test url")) {
            return;
        }

    }

    function getReplaceData(): IRedirectReplaceData {
        let result: IRedirectReplaceData = { urlFilter: "" };
        Object.keys(editElems).forEach(e => {
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
                `Field "${elem.parentElement.previousSibling.textContent} cannot be empty."`,
                mark);
        }

        isValidCustom(elem: HTMLInputElement | HTMLTextAreaElement, isValid: () => boolean, errorMessage: string, mark = true) {
            this.isValid = isValid();
            if (mark) {
                if (this.isValid) {
                    elem.classList.remove("not_valid");
                }
                else {
                    elem.classList.add("not_valid")
                }
            }

            if (!this.isValid) {
                this.addError(errorMessage);
            }

            return this.isValid;
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