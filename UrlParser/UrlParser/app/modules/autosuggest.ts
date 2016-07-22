module UrlParser {

    export interface IAutoSuggestData {
        [pageHostName: string]: IAutoSuggestPageData;
    }

    export interface IAutoSuggestPageData {
        [paramName: string]: string[]
    }

    export class AutoSuggest {

        private settings: Settings;

        private parsedData: IAutoSuggestData;

        private suggestions: Suggestions;

        private baseUrl: Uri;

        constructor(settings: Settings, doc: Document, baseUrl: Uri) {
            this.settings = settings;
            this.baseUrl = baseUrl;

            // initialize suggestions container
            this.suggestions = new Suggestions(doc);

            // bind event handlers
            document.body.addEventListener("DOMFocusOut", evt => {
                this.suggestions.hide();
            });
            document.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(<HTMLInputElement>evt.target));
            document.body.addEventListener("input", evt => this.onDomEvent(<HTMLInputElement>evt.target));
        }

        onSubmission(submittedUri: Uri) {
            // compute differences and save new params
            this.baseUrl = submittedUri;
        }

        private onDomEvent(elem: HTMLInputElement) {
            if (elem.tagName == "INPUT" && elem.type == "text" && elem.parentElement["param-name"]) {
                var name, value;
                switch (elem.name) {
                    case "name":
                        name = elem.value;
                        break;
                    case "value":
                        name = (<HTMLInputElement>elem.previousElementSibling).value;
                        value = elem.value;
                        break;
                }

                if (name) {
                    this.showSuggestions(elem, name, value);
                }
            }
        }

        private showSuggestions(elem: HTMLInputElement, name: string, value: string): void {
            // check if auto-suggest functionality is enabled
            if (!this.settings.autoSuggest) {
                return;
            }

            // parse the data if it wasn't already
            if (this.parsedData == undefined) {
                this.parsedData = JSON.parse(this.settings.autoSuggestData);
            }

            var pageData = this.parsedData[this.baseUrl.hostname()]
            if (pageData) {
                var suggestions: string[] = [];

                var prefix: string;

                // check if name is being edited
                if (value == undefined) {
                    suggestions = Object.keys(pageData);
                    prefix = name;
                }
                else if (pageData[name]) {
                    suggestions = Object.keys(pageData[name]);
                    prefix = value;
                }

                if (suggestions.length > 0) {
                    this.suggestions.bulkAdd(suggestions.filter(text => {
                        // suggestion must be longer than prefix
                        return prefix.length < text.length &&
                            // and must start with prefix
                            text.substr(0, prefix.length) == prefix;
                    }));

                    this.suggestions.show(elem);
                }
            }
        }

        private 
    }

    class Suggestions {

        private container: HTMLUListElement;

        private doc: Document;

        constructor(doc: Document) {
            this.doc = doc;
            this.container = doc.createElement("ul");
            this.container.setAttribute("style", "position: absolute; margin: 0; background-color: white; border: 1px solid gray; display: none; list-style: none; padding: 0 5px");
            this.doc.body.appendChild(this.container);
        }

        add(text: string) {
            var li = this.doc.createElement("li");
            li.textContent = text;
            this.container.appendChild(li);
        }

        bulkAdd(texts: string[]) {
            this.clear();
            texts.forEach(text => this.add(text));
        }

        clear() {
            this.container.innerHTML = "";
            this.hide();
        }

        show(elem: HTMLInputElement) {
            // show only if there is anything to show
            if (this.container.innerHTML) {
                var pos = elem.getBoundingClientRect();
                this.container.style.top = pos.bottom + "px";
                this.container.style.left = pos.left + "px";
                this.container.style.display = "block";
            }
        }

        hide() {
            this.container.style.display = "none";
        }
    }
}