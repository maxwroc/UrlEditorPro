
module UrlEditor.Options {
    export class Validator {

        public isValid = true;
        public errorMessages: string[] = [];
        private outputElem: HTMLDivElement;
        private markedFields: HTMLElement[] = [];

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

        isValidCustom(elem: HTMLInputElement | HTMLTextAreaElement, isValid: (val: string) => boolean, errorMessage: string, mark = true) {
            let valid = isValid(elem.value);
            if (mark) {
                if (valid) {
                    elem.classList.remove("not_valid");
                }
                else {
                    this.markedFields.push(elem);
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

        clear() {
            this.markedFields.forEach(f => f.classList.remove("not_valid"));
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