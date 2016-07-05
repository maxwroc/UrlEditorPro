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
            doc.body.addEventListener("keyup", evt => this.eventDispatcher(evt));

            this.populateFieldsExceptActiveOne();
        }

        private eventDispatcher(evt: KeyboardEvent) {
            // casting to the INPUT elem but it can be a TEXTAREA as well
            var elem = <HTMLInputElement>evt.target;

            if (this.formTextElements.indexOf(elem.tagName) != -1) {
                // check if element has a special property
                if (elem.id && typeof this.mapIdToFunction[elem.id]) {
                    this.url[this.mapIdToFunction[elem.id]](elem.value);
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
                this.formTextElements.indexOf(this.doc.activeElement.tagName) == -1 ||
                // or active element does not belong to param fields (and only if it is a full_url field)
                // second part of this condition is an optimization as for now we have only one text field which should trigger params population
                (!this.doc.activeElement["param-name"] && this.doc.activeElement.id == "full_url")) {
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
            param["param-name"] = encodeURIComponent(name) || "--";
            param.innerHTML = '<input type="text" class="name" /> <input type="text" class="value" /> <input type="checkbox" title="Encode / decode" /> <input type="button" value="x" />';
            return param;
        }
    }
}