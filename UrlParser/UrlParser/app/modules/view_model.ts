module UrlParser {

    export class ViewModel {
        private url: Uri;
        private doc: HTMLDocument;

        private formTextElements = ["INPUT", "TEXTAREA"];

        private mapIdToProperty: IMap = {
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
                if (elem.id && typeof this.mapIdToProperty[elem.id]) {
                    this.url[this.mapIdToProperty[elem.id]](elem.value);
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
                    if (elem.id && this.mapIdToProperty[elem.id]) {
                        // updating element value using a function name taken from mapping
                        this.setValueIfNotActive(elem, this.url[this.mapIdToProperty[elem.id]]());
                    }
                }
            });
            

        }

        private setValueIfNotActive(elem: HTMLInputElement, value: string) {
            // check if it isn't currently active element (we don't want to overwrite text which user might be typing still)
            if (elem != this.doc.activeElement) {
                elem.value = value;
            }
        }
    }
}