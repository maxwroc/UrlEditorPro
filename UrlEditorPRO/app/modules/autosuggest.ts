/// <reference path="settings.ts" />
/// <reference path="tracking.ts" />
/// <reference path="url_parser.ts" />
/// <reference path="../shared/interfaces.shared.d.ts" />
/// <reference path="../shared/autosuggest.shared.ts" />

module UrlEditor {

    const AutoSuggestData = Shared.AutoSuggest.Data;

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

        public static HOST_ALIAS_KEY = "[suggestionAlias]";

        private settings: Settings;

        private autoSuggestData: Shared.AutoSuggest.Data;

        private pageData: Shared.AutoSuggest.Page;

        private suggestions: Suggestions;

        private baseUrl: Uri;

        constructor(settings: Settings, doc: Document, baseUrl: Uri, private isInIncognitoMode: boolean) {
            this.settings = settings;
            this.baseUrl = new Uri(baseUrl.url());
            this.autoSuggestData = new AutoSuggestData(settings);
            this.pageData = this.autoSuggestData.getPage(this.baseUrl.hostname());

            // initialize suggestions container
            this.suggestions = new Suggestions(doc, this);

            // bind event handlers
            doc.body.addEventListener("DOMFocusOut", evt => {
                this.suggestions.hide();
            });
            doc.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(<HTMLInputElement>evt.target));
            doc.body.addEventListener("input", evt => this.onDomEvent(<HTMLInputElement>evt.target));
        }

        onSubmission(submittedUri: Uri) {

            // check if we shouldn't save param data
            if (!this.settings.autoSuggestSaveNew ||
                // check if host is not the same
                this.baseUrl.hostname() != submittedUri.hostname() ||
                (this.isInIncognitoMode && !this.settings.autoSuggestEnabledOnIncognito)) {

                // not saving data
                return;
            }

            let baseParams = this.baseUrl.params();
            let submittedParams = submittedUri.params();

            // create a list of params to save
            let paramsToSave: IMap<string[]>;
            Object.keys(submittedParams).forEach(name => {
                // add params to save list when they were just added
                if (baseParams[name] == undefined ||
                    // or their values are different than before (this is not the most efficient way to compare arrays but it's simple and works)
                    baseParams[name].join(",") != submittedParams[name].join(",")) {

                    // initilize collection whenever it is needed
                    paramsToSave = paramsToSave || {};
                    // take only values which were not saved previously
                    let newValues = submittedParams[name].filter(val => !baseParams[name] || baseParams[name].indexOf(val) == -1);

                    // skip empty ones
                    if (newValues.length) {
                        paramsToSave[name] = newValues;
                    }
                }
            });

            if (paramsToSave) {
                let page = this.autoSuggestData.getPage(submittedUri.hostname());

                Object.keys(paramsToSave).forEach(name => {

                    // iterate over newly added param values
                    paramsToSave[name].forEach(val => {
                        page.add(name, val);
                    });
                });

                this.autoSuggestData.save();
            }

            // create new Uri object to avoid keeping same reference
            this.baseUrl = new Uri(submittedUri.url());
        }

        deleteSuggestion(paramName: string, paramValue?: string) {
            if (paramValue != undefined) { // removing value suggestion
                this.pageData.deleteParamValue(paramName, paramValue);
            }
            else { // removing param suggestion
                this.pageData.deleteParam(paramName);
            }

            this.autoSuggestData.save();
        }

        private onDomEvent(elem: HTMLInputElement) {
            if (elem.tagName == "INPUT" && elem.type == "text" && (<IParamContainerElement>elem.parentElement).isParamContainer) {
                let name, value;
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

            if (this.autoSuggestData.exists(this.baseUrl.hostname())) {
                let prefix: string;
                let suggestions: string[] = [];
                let page = this.autoSuggestData.getPage(this.baseUrl.hostname());

                // check if param name is being edited
                if (value == undefined) {
                    suggestions = page.getParamNames();
                    prefix = name;
                }
                else if (page.getParamValues(name)) {
                    suggestions = page.getParamValues(name);
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
            let li = this.doc.createElement("li");
            li.textContent = text;
            li.className = "suggestion";
            li["suggestionText"] = text;

            // delete button
            let del = this.doc.createElement("span");
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

                this.inputElem = elem;

                // we need to wrap it to be able to remove it later
                this.handler = (evt: KeyboardEvent) => this.keyboardNavigation(evt);
                this.inputElem.addEventListener("keydown", this.handler, true);

                this.originalText = this.inputElem.value;

                // allow to flush all the DOM changes before adjusting position
                //setTimeout(() => this.adjustPositionAndHeight(), 0);
                this.adjustPositionAndHeight()
            }
        }

        hide() {
            this.container.style.display = "none";
            if (this.inputElem) {
                this.inputElem.removeEventListener("keydown", this.handler, true);
            }
            this.active = undefined;
        }

        private adjustPositionAndHeight() {
            let pos = this.inputElem.getBoundingClientRect();
            // pos doesn't contain scroll value so we need to add it
            let posTop = pos.bottom + window.scrollY - 3;
            this.container.style.top = posTop + "px";
            this.container.style.left = pos.left + "px";
            this.container.style.display = "block";
            this.container.style.minWidth = this.inputElem.offsetWidth + "px";
            this.container.style.height = "auto";
            this.container.style.width = "auto";

            // reduce the height if it is reached page end
            let tooBig = posTop + this.container.offsetHeight - (this.doc.body.offsetHeight + 8); // increase by 8 due to margin
            if (tooBig > 0) {
                this.container.style.height = (this.container.offsetHeight - tooBig) + "px";
            }

            // reduce width if it is too wide
            let tooWide = pos.left + this.container.offsetWidth - (this.doc.body.offsetWidth + 8);
            if (tooWide > 0) {
                this.container.style.width = (this.container.offsetWidth - tooWide) + "px";
            }

            // increase by 2px due to border size
            Helpers.ensureIsVisible(this.container, this.doc.body, window.innerHeight + 2);
        }

        private mouseEventHandler(evt: MouseEvent) {
            let elem = <HTMLElement>evt.target;

            switch (elem.className) {
                case "suggestion":
                    this.inputElem.value = (<ISuggestion>elem).suggestionText;

                    Tracking.trackEvent(Tracking.Category.AutoSuggest, "used");

                    // trigger event which will update param in the url (via view model)
                    let e = new Event("updated");
                    e.initEvent("updated", true, true);
                    this.inputElem.dispatchEvent(e)
                    break;
                case "delete":

                    Tracking.trackEvent(Tracking.Category.AutoSuggest, "delete");

                    this.deleteSuggestion(<ISuggestion>elem.parentElement);
                    // prevent from triggering same event on suggestion
                    evt.stopPropagation();
                    // prevent from closing suggestions drawer
                    evt.preventDefault();
                    break;
            }
        }

        private keyboardNavigation(evt: KeyboardEvent) {
            let handled: boolean;
            let elementToFocus: HTMLInputElement;

            // allow user to navigate to other input elem
            if (evt.ctrlKey && evt.keyCode != 68) {
                return;
            }

            let suggestionToSelect: ISuggestion;

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

                        let nextInput = <HTMLInputElement>this.inputElem.nextElementSibling;
                        if (nextInput.tagName == "INPUT" && nextInput.type == "text") {
                            elementToFocus = nextInput;
                        }
                        else {
                            // hack: close suggestions pane when no next element
                            setTimeout(() => this.hide(), 1);
                        }

                        Tracking.trackEvent(Tracking.Category.AutoSuggest, "used");

                        // trigger event which will update param in the url (via view model)
                        let e = new Event("updated");
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
                // increase by 2px due to border size
                Helpers.ensureIsVisible(suggestionToSelect, this.container, this.container.offsetHeight + 2);
            }
            else {
                this.container.scrollTop = 0;
            }

            this.active = suggestionToSelect;


            if (handled) {
                // just in case any of handled key combinations would have some default action
                evt.preventDefault();
                // prevent from further handling
                evt.stopPropagation();

                // put suggestion text into input elem
                this.inputElem.value = this.active ? this.active.suggestionText : this.originalText;
            }


            if (elementToFocus) {
                elementToFocus.focus();
            }
        }

        private deleteSuggestion(suggestion: ISuggestion) {
            let paramElem = <IParamContainerElement>this.inputElem.parentElement;

            // check if user wants to remove value suggestion
            if (this.inputElem == paramElem.valueElement) {
                this.autoSuggest.deleteSuggestion(paramElem.nameElement.value, suggestion.suggestionText);
            }
            else {
                // removing param-name suggestion
                this.autoSuggest.deleteSuggestion(suggestion.suggestionText);
            }

            // remove suggestion from DOM
            this.container.removeChild(suggestion);

            if (this.container.childElementCount == 0) {
                this.hide();
            }
        }
    }
}