module UrlParser {

    var paramEncodedPattern = /%[a-fA-F0-9]{2}/;

    export class ViewModel {
        private url: Uri;
        private doc: HTMLDocument;

        private formTextElements = ["INPUT", "TEXTAREA"];

        private mapIdToFunction: IMap = {
            "full_url": "url",
            "hostname": "host",
            "path": "pathname"
        };

        private submit: (URL: string) => void;

        constructor(url: Uri, doc: HTMLDocument, submit: (url:string) => void) {
            this.url = url;
            this.doc = doc;
            this.submit = submit;

            // bind event handlers
            doc.body.addEventListener("click", evt => this.clickEventDispatcher(evt));
            doc.body.addEventListener("keyup", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("keydown", evt => {
                if (this.isTextFieldActive() && evt.keyCode == 13) {
                    submit(this.url.url());
                    // we don't want a new line to be added in TEXTAREA
                    evt.preventDefault();
                }
            });

            this.populateFieldsExceptActiveOne();
        }

        private clickEventDispatcher(evt: MouseEvent) {
            var elem = <HTMLElement>evt.target;
            if (elem.tagName == "INPUT") {
                var inputElem = <HTMLInputElement>elem;
                switch (inputElem.type) {
                    case "checkbox":
                        this.checkboxClickHandler(inputElem);
                        break;
                    case "button":
                        this.buttonClickHandler(inputElem);
                        break;
                }
            }
        }

        private checkboxClickHandler(elem: HTMLInputElement) {
            var valElem = <HTMLInputElement>elem.previousElementSibling;

            // we have only one checkbox for encoding/decoding value
            if (elem.checked) {
                valElem.value = decodeURIComponent(valElem.value);
            }
            else {
                valElem.value = encodeURIComponent(valElem.value);
            }
        }

        private buttonClickHandler(elem: HTMLInputElement) {
            // this handler is triggered for any button click on page

            var paramName = elem.parentElement["param-name"];
            if (paramName) {
                // this seems to be a delete param button so we're removing param
                this.deleteParam(paramName);
                this.populateFieldsExceptActiveOne();
            }
            else {
                switch (elem.id) {
                    case "add_param":
                        // add param button
                        this.doc.getElementById("params").appendChild(this.createNewParamFields());
                        break;
                    case "go":
                        // submit button
                        this.submit(this.url.url());
                        break;
                }
            }
        }

        private keyboardEventDispatcher(evt: KeyboardEvent) {
            // casting to the INPUT elem but it can be a TEXTAREA as well
            var elem = <HTMLInputElement>evt.target;

            if (this.isTextFieldActive()) {
                // clear error message
                this.setErrorMessage("", elem);

                // check if we have a mapping from field ID to Url object function (used for basic fields)
                if (elem.id && typeof this.mapIdToFunction[elem.id] != "undefined") {
                    var funcName = this.mapIdToFunction[elem.id];

                    this.url[funcName](elem.value);

                    if (elem.value != this.url[funcName]()) {
                        // default http port number is removed automatically so we shouldn't show error in that case
                        if (funcName != "host" || elem.value.match(/:80$/) == null) {
                            this.setErrorMessage("url is invalid", elem);
                        }
                    }

                    this.populateFieldsExceptActiveOne();
                }
                // check if event happened on one of param fields
                else if (elem.parentElement["param-name"]) {

                    if (elem.classList.contains("name")) {
                        this.updateParamName(elem);
                    }
                    else if (elem.classList.contains("value")) {
                        this.updateParamValue(elem);
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
                // just in case we remove the error class
                elem.classList.remove("error");

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
                // check if param value is encoded
                var isEncoded = paramEncodedPattern.test(urlParams[name]);

                // parameter name field
                var paramNameElem = <HTMLInputElement>param.firstElementChild;
                paramNameElem.value = name;

                // parameter value field
                var paramValue = <HTMLInputElement>paramNameElem.nextElementSibling;
                paramValue.value = isEncoded ? decodeURIComponent(urlParams[name]) : urlParams[name];

                // parameter encoded checkbox
                if (isEncoded) {
                    var paramEncoded = <HTMLInputElement>paramValue.nextElementSibling;
                    paramEncoded.checked = true;
                }

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
            var safeNewName = encodeURIComponent(elem.value);
            var params = this.url.params();

            // check if param exists already and it is different than the initial one
            if (params[safeNewName] && safeNewName != origName) {
                elem.classList.add("error");
                this.setErrorMessage("param with the same name already exists", elem);
                return;
            }

            // if name is empty string we need to remove param
            if (safeNewName == "") {
                this.deleteParam(origName)
            }
            else {
                // it is impossible to raneme property so we need to delete old one and add new one
                if (params[origName] != undefined) {
                    // remove parameter from the list
                    delete params[origName];
                }

                var value = (<HTMLInputElement>elem.nextElementSibling).value;
                var shouldEncode = elem.nextElementSibling.nextElementSibling["checked"];
                // readding it with new name
                params[safeNewName] = shouldEncode ? encodeURIComponent(value) : value;
                this.url.params(params);

                elem.parentElement["param-name"] = safeNewName;
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
            return this.formTextElements.indexOf(this.doc.activeElement.tagName) != -1 && (this.doc.activeElement["type"] == "textarea" || this.doc.activeElement["type"] == "text");
        }

        private setErrorMessage(err: string, elem?: HTMLElement) {
            // setting error message
            this.doc.getElementById("err").textContent = err ? "Error: " + err : "";

            // if DOM element was passed we're setting or removing the error indicator color
            if (elem) {
                if (err) {
                    elem.classList.add("error");
                }
                else {
                    elem.classList.remove("error");
                }
            }
        }
    }
}