module UrlParser {

    export class ViewModel {
        private url: Uri;
        private doc: HTMLDocument;

        private formTextElements = ["INPUT", "TEXTAREA"];

        private mapIdToFunction: IMap = {
            "full_url": "url",
            "hostname": "hostname",
            "path": "pathname"
        };

        constructor(url: Uri, doc: HTMLDocument) {
            this.url = url;
            this.doc = doc;

            // bind event handlers
            doc.body.addEventListener("keyup", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("click", evt => this.clickEventDispatcher(evt));

            this.populateFieldsExceptActiveOne();
        }

        private clickEventDispatcher(evt: MouseEvent) {
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
                    case "button":
                        var paramName = elem.parentElement["param-name"];
                        this.deleteParam(paramName);
                        this.populateFieldsExceptActiveOne();
                        break;
                }
            }
        }

        private keyboardEventDispatcher(evt: KeyboardEvent) {
            // casting to the INPUT elem but it can be a TEXTAREA as well
            var elem = <HTMLInputElement>evt.target;

            if (this.isTextFieldActive()) {
                // check if element has a special property
                if (elem.id && typeof this.mapIdToFunction[elem.id]) {
                    this.url[this.mapIdToFunction[elem.id]](elem.value);
                    this.populateFieldsExceptActiveOne();
                }
                else if (elem.parentElement["param-name"]) {
                    switch (elem.className) {
                        case "name":
                            this.updateParamName(elem);
                            break;
                        case "value":
                            this.updateParamValue(elem);
                            break;
                    }

                    this.populateFieldsExceptActiveOne();
                }
            }
        }

        private populateFieldsExceptActiveOne() {
            // iterate over elements which should be populatad
            this.formTextElements.forEach(tagName => {
                var elements = this.doc.getElementsByTagName(tagName);

                for (var i = 0, elem; elem = <HTMLInputElement>elements[i]; i++) {
                    // check if element has ID set, the mapping exists 
                    if (elem.id && this.mapIdToFunction[elem.id]) {
                        // updating element value using a function name taken from mapping
                        this.setValueIfNotActive(elem, this.url[this.mapIdToFunction[elem.id]]());
                    }
                }
            });

            // updating params only if there is no active element (probably this condition is redundant)
            if (!this.doc.activeElement ||
                // or if the active element is not one of the text fields
                !this.isTextFieldActive() ||
                // or active element does not one of param fields
                !this.doc.activeElement.parentElement["param-name"]) {
                this.populateParams();
            }
        }

        private setValueIfNotActive(elem: HTMLInputElement, value: string) {
            // check if it isn't currently active element (we don't want to overwrite text which user might be typing still)
            if (elem != this.doc.activeElement) {
                elem.value = value;
            }
        }

        private populateParams() {

            var params = this.doc.getElementById("params");

            // clean old set of params
            params.innerHTML = "";

            var urlParams = this.url.params();
            for (var name in urlParams) {
                var param = this.createNewParamFields(name);

                // parameter name field
                var paramNameElem = <HTMLInputElement>param.firstElementChild;
                paramNameElem.value = name;

                // parameter value field
                var paramValue = <HTMLInputElement>paramNameElem.nextElementSibling;
                paramValue.value = urlParams[name];

                params.appendChild(param);
            }
        }

        private createNewParamFields(name?: string): HTMLElement {
            var param = <HTMLDivElement>document.createElement("div");
            param.className = "param";
            // we need to encode param name as it may contain invalid chars for url
            // the default value is specified to prevent from addiong this param to the url object
            param["param-name"] = encodeURIComponent(name) || "--";
            param.innerHTML = '<input type="text" class="name" /> <input type="text" class="value" /> <input type="checkbox" title="Encode / decode" /> <input type="button" value="x" />';
            return param;
        }

        private deleteParam(name: string) {
            // remove param
            if (name) {
                var params = this.url.params();
                delete params[name];
                this.url.params(params);
            }
        }

        private updateParamName(elem: HTMLInputElement): void {
            var origName = elem.parentElement["param-name"];

            // if name is empty string we need to remove param
            if (elem.value == "") {
                this.deleteParam(origName)
            }
            else {
                var params = this.url.params();

                // it is impossible to raneme property so we need to delete old one and add new one
                if (params[origName] != undefined) {
                    // remove parameter from the list
                    delete params[origName];
                }

                // readding it with new name
                params[elem.value] = (<HTMLInputElement>elem.nextElementSibling).value;
                this.url.params(params);

                elem.parentElement["param-name"] = elem.value;
            }
        }

        private updateParamValue(elem: HTMLInputElement): void {
            // check if it's a temporary param name
            if (elem.parentElement["param-name"] == "--") {
                // do nothing - we cannot set param without its name
                return;
            }
            var params = this.url.params();
            params[elem.parentElement["param-name"]] = elem.nextElementSibling["checked"] ? encodeURIComponent(elem.value) : elem.value;
            this.url.params(params);
        }

        private isTextFieldActive(): boolean {
            // check if tag is an INPUT or TEXTAREA, additionally check if the INPUT type is text
            return this.formTextElements.indexOf(this.doc.activeElement.tagName) != -1 && (!this.doc.activeElement["type"] || this.doc.activeElement["type"] == "text");
        }
    }
}