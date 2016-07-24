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
            this.baseUrl = new Uri(baseUrl.url());

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
            if (this.settings.autoSuggestSaveNew && this.parsedData) {
                // compute differences and save new params
                var baseParams = this.baseUrl.params();
                var newParams = submittedUri.params();

                var baseParamNames = Object.keys(baseParams);
                var newParamNames = Object.keys(newParams);


                var diffNames = newParamNames.filter(newParam => baseParamNames.indexOf(newParam) < 0);
                if (diffNames.length > 0) {

                    var pageName = submittedUri.hostname();
                    // make sure that page entry is set
                    this.parsedData[pageName] = this.parsedData[pageName] || {};

                    var existingNames = Object.keys(this.parsedData[pageName]);

                    diffNames.forEach(newParam => {
                        if (existingNames.indexOf(newParam) == -1) {
                            this.parsedData[pageName][newParam] = [];
                        }

                        // remove if exists currently
                        this.parsedData[pageName][newParam] = this.parsedData[pageName][newParam].filter(val => val != newParam);

                        // add on the beginning
                        this.parsedData[pageName][newParam].unshift(newParams[newParam]);
                    });

                    // save in settings
                    this.settings.setValue("autoSuggestData", JSON.stringify(this.parsedData));
                }

                this.baseUrl = submittedUri;
            }
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
                    suggestions = pageData[name];
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

        private elem: HTMLInputElement;

        private handler;

        private active: HTMLLIElement;

        private originalText: string;

        constructor(doc: Document) {
            this.doc = doc;
            this.container = doc.createElement("ul");
            this.container.className = "suggestions";
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
                this.container.style.top = (pos.bottom - 3) + "px";
                this.container.style.left = pos.left + "px";
                this.container.style.display = "block";
                this.container.style.width = elem.offsetWidth + "px";

                this.elem = elem;
                this.originalText = this.elem.value;

                // we need to wrap it to be able to remove it later
                this.handler = (evt: KeyboardEvent) => this.keyboardNavigation(evt);

                this.elem.addEventListener("keydown", this.handler, true);
            }
        }

        hide() {
            this.container.style.display = "none";
            if (this.elem) {
                this.elem.removeEventListener("keydown", this.handler, true);
                this.elem = undefined;
            }
            this.active = undefined;
        }

        private keyboardNavigation(evt: KeyboardEvent) {
            var handled: boolean;
            var elementToFocus: HTMLInputElement;

            // allow user to navigate to other input elem
            if (evt.ctrlKey) {
                return;
            }

            var suggestionToSelect: HTMLLIElement;

            switch (evt.keyCode) {
                case 38: // up
                    handled = true;
                    suggestionToSelect = this.active ? <HTMLLIElement>this.active.previousElementSibling : <HTMLLIElement>this.container.lastElementChild;
                    break;
                case 40: // down
                    handled = true;
                    suggestionToSelect = this.active ? <HTMLLIElement>this.active.nextElementSibling : <HTMLLIElement>this.container.firstElementChild;
                    break;
                case 9: // tab
                case 13: // enter
                    if (this.active) {
                        handled = true;
                        this.originalText = this.active.textContent;

                        var nextInput = <HTMLInputElement>this.elem.nextElementSibling;
                        if (nextInput.tagName == "INPUT" && nextInput.type == "text") {
                            elementToFocus = nextInput;
                        }
                        else {
                            // hack: close suggestions pane when no next element
                            setTimeout(() => this.hide(), 1);
                        }
                        
                        var e = new Event("updated");
                        e.initEvent("updated", true, true);
                        this.elem.dispatchEvent(e)
                    }
                    break;
                case 27: // escape
                    handled = true;
                    // delay hiding to properly execute remaining code
                    setTimeout(() => this.hide(), 1);
                    break;
            }

            this.active && this.active.classList.remove("hv");
            suggestionToSelect && suggestionToSelect.classList.add("hv");

            this.active = suggestionToSelect;

            // put suggestion text into input elem
            this.elem.value = this.active ? this.active.textContent : this.originalText;

            if (handled) {
                evt.preventDefault();
            }

            evt.stopPropagation();

            if (elementToFocus) {
                elementToFocus.focus();
            }
        }
    }
}