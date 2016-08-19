module UrlEditor {

    export interface IAutoSuggestData {
        [pageHostName: string]: IAutoSuggestPageData;
    }

    export interface IAutoSuggestPageData {
        [paramName: string]: string[]
    }

    interface ISuggestion extends HTMLLIElement {
        suggestionText: string;
    }

    export class AutoSuggest {

        private settings: Settings;

        private parsedData: IAutoSuggestData;

        private suggestions: Suggestions;

        private baseUrl: Uri;

        constructor(settings: Settings, doc: Document, baseUrl: Uri, private isInIncognitoMode: boolean) {
            this.settings = settings;
            this.baseUrl = new Uri(baseUrl.url());

            // initialize suggestions container
            this.suggestions = new Suggestions(doc, this);

            // bind event handlers
            document.body.addEventListener("DOMFocusOut", evt => {
                this.suggestions.hide();
            });
            document.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(<HTMLInputElement>evt.target));
            document.body.addEventListener("input", evt => this.onDomEvent(<HTMLInputElement>evt.target));
        }

        onSubmission(submittedUri: Uri) {
        
            // check if we shouldn't save param data
            if (!this.settings.autoSuggestSaveNew ||
                // check if auto-suggest was not triggered at least once
                !this.parsedData ||
                // check if host is not the same
                this.baseUrl.hostname() != submittedUri.hostname() ||
                (this.isInIncognitoMode && !this.settings.autoSuggestEnabledOnIncognito)) {

                // not saving data
                return;
            }
            
            var baseParams = this.baseUrl.params();
            var submittedParams = submittedUri.params();
            
            // create a list of params to save
            var paramsToSave: IMap<string[]>;
            Object.keys(submittedParams).forEach(name => {
                // add params to save list when they were just added
                if (baseParams[name] == undefined ||
                    // or their value is different than before
                    baseParams[name] != submittedParams[name]) {
                    // initilize collection whenever it is needed
                    paramsToSave = paramsToSave || {};
                    // take only values which were not saved previously
                    paramsToSave[name] = submittedParams[name].filter(val => !baseParams[name] || baseParams[name].indexOf(val) == -1);
                }
            });

            if (paramsToSave) {
                var pageName = submittedUri.hostname();
                // make sure that the entry exists
                var pageData = this.parsedData[pageName] = this.parsedData[pageName] || {};

                Object.keys(paramsToSave).forEach(name => {
                    // make sure collection of values for parameter name exists
                    pageData[name] = pageData[name] || [];

                    // iterate over newly added param values
                    paramsToSave[name].forEach(val => {
                        // check if value already exists
                        var foundOnPosition = pageData[name].indexOf(val);
                        if (foundOnPosition != -1) {
                            // remove it as we want to add it on the beginning of the collection later
                            pageData[name].splice(foundOnPosition, 1);
                        }

                        // add value on the beginning
                        pageData[name].unshift(val);
                    });
                });

                // save in settings
                this.settings.setValue("autoSuggestData", JSON.stringify(this.parsedData));
                // clear data cache
                this.parsedData = undefined;
            }

            // create new Uri object to avoid keeping same reference
            this.baseUrl = new Uri(submittedUri.url());
        }
        
        deleteSuggestion(paramName: string, paramValue?: string) {
            var pageName = this.baseUrl.hostname();

            if (this.parsedData && this.parsedData[pageName]) {

                if (paramValue != undefined) { // removing value suggestion
                    if (this.parsedData[pageName][paramName]) {
                        // remove suggestion from settings
                        this.parsedData[pageName][paramName] = this.parsedData[pageName][paramName].filter(val => val != paramValue);
                    }
                }
                else { // removing param suggestion
                    delete this.parsedData[pageName][paramName];
                }
                
                this.settings.setValue("autoSuggestData", JSON.stringify(this.parsedData));
            }
        }

        private onDomEvent(elem: HTMLInputElement) {
            if (elem.tagName == "INPUT" && elem.type == "text" && (<IParamContainerElement>elem.parentElement).isParamContainer) {
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
                else {
                    this.suggestions.hide();
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

                    Tracking.trackEvent(Tracking.Category.AutoSuggest, "shown");
                    this.suggestions.show(elem);
                }
            }
        } 
    }

    class Suggestions {

        private container: HTMLUListElement;

        private inputElem: HTMLInputElement;

        private handler;

        private active: ISuggestion;

        private originalText: string;

        constructor(private doc: Document, private autoSuggest: AutoSuggest) {
            this.container = doc.createElement("ul");
            this.container.className = "suggestions";
            this.doc.body.appendChild(this.container);

            // need to use mousedown as click event is triggered too late (after DOMFocusIn which is hidding suggestions)
            this.container.addEventListener("mousedown", evt => this.mouseEventHandler(evt));
        }

        add(text: string) {
            var li = this.doc.createElement("li");
            li.textContent = text;
            li.className = "suggestion";
            li["suggestionText"] = text;

            // delete button
            var del = this.doc.createElement("span");
            del.textContent = "x";
            del.className = "delete";
            del.title = "Press Ctrl+D to remove";
            li.appendChild(del);

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
                // pos doesn't contain scroll value so we need to add it
                var posTop = pos.bottom + document.body.scrollTop - 3;
                this.container.style.top = posTop + "px";
                this.container.style.left = pos.left + "px";
                this.container.style.display = "block";
                this.container.style.minWidth = elem.offsetWidth + "px";
                this.container.style.height = "auto";
                this.container.style.width = "auto";

                // reduce the height if it is reached page end
                var tooBig = posTop + this.container.offsetHeight - (this.doc.body.offsetHeight + 8); // increase by 8 due to margin
                if (tooBig > 0) {
                    this.container.style.height = (this.container.offsetHeight - tooBig) + "px"; 
                }

                // reduce width if it is too wide
                var tooWide = pos.left + this.container.offsetWidth - (this.doc.body.offsetWidth + 8);
                if (tooWide > 0) {
                    this.container.style.width = (this.container.offsetWidth - tooWide) + "px";
                }

                this.inputElem = elem;
                this.originalText = this.inputElem.value;

                // we need to wrap it to be able to remove it later
                this.handler = (evt: KeyboardEvent) => this.keyboardNavigation(evt);

                this.inputElem.addEventListener("keydown", this.handler, true);
            }
        }

        hide() {
            this.container.style.display = "none";
            if (this.inputElem) {
                this.inputElem.removeEventListener("keydown", this.handler, true);
                this.inputElem = undefined;
            }
            this.active = undefined;
        }

        private mouseEventHandler(evt: MouseEvent) {
            var elem = <HTMLElement>evt.target;

            switch (elem.className) {
                case "suggestion":
                    this.inputElem.value = (<ISuggestion>elem).suggestionText;
                    break;
                case "delete":
                    this.deleteSuggestion(<ISuggestion>elem.parentElement);
                    // prevent from triggering same event on suggestion
                    evt.stopPropagation();
                    // prevent from closing suggestions drawer
                    evt.preventDefault();
                    break;
            }
        }

        private keyboardNavigation(evt: KeyboardEvent) {
            var handled: boolean;
            var elementToFocus: HTMLInputElement;

            // allow user to navigate to other input elem
            if (evt.ctrlKey && evt.keyCode != 68) {
                return;
            }

            var suggestionToSelect: ISuggestion;

            switch (evt.keyCode) {
                case 38: // up
                    handled = true;
                    suggestionToSelect = this.active ? <ISuggestion>this.active.previousElementSibling : <ISuggestion>this.container.lastElementChild;
                    break;
                case 40: // down
                    handled = true;
                    suggestionToSelect = this.active ? <ISuggestion>this.active.nextElementSibling : <ISuggestion>this.container.firstElementChild;
                    break;
                case 9: // tab
                case 13: // enter
                    if (this.active) {
                        handled = true;
                        this.originalText = this.active.suggestionText;

                        var nextInput = <HTMLInputElement>this.inputElem.nextElementSibling;
                        if (nextInput.tagName == "INPUT" && nextInput.type == "text") {
                            elementToFocus = nextInput;
                        }
                        else {
                            // hack: close suggestions pane when no next element
                            setTimeout(() => this.hide(), 1);
                        }

                        Tracking.trackEvent(Tracking.Category.AutoSuggest, "used");
                        
                        var e = new Event("updated");
                        e.initEvent("updated", true, true);
                        this.inputElem.dispatchEvent(e)
                    }
                    break;
                case 27: // escape
                    handled = true;
                    // delay hiding to properly execute remaining code
                    setTimeout(() => this.hide(), 1);
                    break;
                case 68: // D
                    if (evt.ctrlKey && this.active) {
                        this.deleteSuggestion(this.active);
                        handled = true;
                    }
                    break;
            }

            this.active && this.active.classList.remove("hv");

            if (suggestionToSelect) {
                Tracking.trackEvent(Tracking.Category.AutoSuggest, "selected");
                suggestionToSelect.classList.add("hv");
                this.ensureIsVisible(suggestionToSelect);
            }
            else {
                this.container.scrollTop = 0;
            }

            this.active = suggestionToSelect;
            

            if (handled) {
                evt.preventDefault();

                // put suggestion text into input elem
                this.inputElem.value = this.active ? this.active.suggestionText : this.originalText;
            }

            evt.stopPropagation();

            if (elementToFocus) {
                elementToFocus.focus();
            }
        }

        private ensureIsVisible(suggestionElem: HTMLElement) {
            var containerScrollTop = this.container.scrollTop;
            var suggestionElemOffsetTop = suggestionElem.offsetTop;
            var offsetBottom = suggestionElemOffsetTop + suggestionElem.offsetHeight;
            if (offsetBottom > containerScrollTop + this.container.offsetHeight) {
                this.container.scrollTop = offsetBottom - this.container.offsetHeight + 2; // increase due to border size
            }
            else if (suggestionElemOffsetTop < containerScrollTop) {
                this.container.scrollTop = suggestionElemOffsetTop;
            }
        }

        private deleteSuggestion(suggestion: ISuggestion) {
            var paramElem = <IParamContainerElement>this.inputElem.parentElement;

            // check if user wants to remove value suggestion
            if (this.inputElem == paramElem.valueElement) {
                this.autoSuggest.deleteSuggestion(paramElem.nameElement.value, suggestion.suggestionText);
            }
            else {
                // removing param-name suggestion
                this.autoSuggest.deleteSuggestion(suggestion.suggestionText);
            }
            
            // remove suggestion from DOM
            suggestion.parentElement.removeChild(suggestion);
        }
    }
}