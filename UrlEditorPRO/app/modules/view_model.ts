module UrlEditor {

    var paramEncodedPattern = /%[a-fA-F0-9]{2}/;
    var port80Pattern = /:80$/;
    var maxClientWidth = 780;
    var paramsMarginSum = 86; //5 * 4 + 2 * 3 + 2 * 22 + 2 * 8;

    export class ViewModel {
        private url: Uri;
        private doc: HTMLDocument;

        private mapIdToFunction: IStringMap = {
            "full_url": "url",
            "hostname": "host",
            "path": "pathname"
        };

        private measureElem: HTMLSpanElement;
        private submit: (uri: Uri) => void;

        private formTextElements = ["INPUT", "TEXTAREA"];

        constructor(url: Uri, doc: HTMLDocument, submit: (uri: Uri) => void) {
            this.url = url;
            this.doc = doc;
            this.submit = submit;


            this.measureElem = <HTMLSpanElement>ge("measure");

            // bind event handlers
            doc.body.addEventListener("click", evt => this.clickEventDispatcher(evt));
            doc.body.addEventListener("input", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("updated", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("keydown", evt => {
                
                if (this.keyboardNavigation(evt)) {
                    return;
                }

                if (this.isTextFieldActive() && evt.keyCode == 13) {
                    Tracking.trackEvent(Tracking.Category.Submit, "keyboard");
                    submit(this.url);
                    // we don't want a new line to be added in TEXTAREA
                    evt.preventDefault();
                }
            });

            this.updateFields();
        }

        private clickEventDispatcher(evt: MouseEvent) {
            var elem = <HTMLElement>evt.target;
            if (elem.tagName == "INPUT") {
                var inputElem = <HTMLInputElement>elem;
                switch (inputElem.type) {
                    case "checkbox":
                        Tracking.trackEvent(Tracking.Category.Encoding, "click", inputElem.checked.toString());
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

            var paramContainer = <IParamContainerElement>elem.parentElement;
            if (paramContainer.isParamContainer) {
                // this seems to be a delete param button so we're removing param
                this.deleteParam(paramContainer);
            }
            else {
                switch (elem.id) {
                    case "add_param":
                        Tracking.trackEvent(Tracking.Category.AddParam, "click");
                        this.addNewParamFields();
                        break;
                    case "go":
                        // submit button
                        Tracking.trackEvent(Tracking.Category.Submit, "click");
                        this.submit(this.url);
                        break;
                }
            }
        }

        private keyboardEventDispatcher(evt: Event) {
            // casting to the INPUT elem but it can be a TEXTAREA as well
            var elem = <HTMLInputElement>evt.target;

            if (this.isTextFieldActive()) {
                // clear error message
                this.setErrorMessage("", elem);

                this.setUriFromFields();
                this.updateFields();
            }
        }

        private updateFields() {
            var activeElem = <HTMLElement>this.doc.activeElement;
            var isTextFieldActive = this.isTextFieldActive();

            if (activeElem.id == "full_url" || !isTextFieldActive) {
                this.populateInputFields(!isTextFieldActive);
            }

            if (activeElem.id != "full_url" || !isTextFieldActive) {
                (<HTMLTextAreaElement>ge("full_url")).value = this.url.url();
            }
        }

        private populateInputFields(setFocusOnLastParam: boolean = false) {
            // iterate over elements which should be populatad
            var elements = this.doc.getElementsByTagName("input");
            for (var i = 0, elem; elem = <HTMLInputElement>elements[i]; i++) {
                // check if element has ID set, the mapping exists 
                if (elem.id && this.mapIdToFunction[elem.id]) {
                    // updating element value using a function name taken from mapping
                    this.setValueIfNotActive(elem, this.url[this.mapIdToFunction[elem.id]]());
                }
            }

            this.populateParams(setFocusOnLastParam);
        }

        private setValueIfNotActive(elem: HTMLInputElement, value: string) {
            // check if it isn't currently active element (we don't want to overwrite text which user might be typing still)
            if (elem != this.doc.activeElement) {
                // just in case we remove the error class
                elem.classList.remove("error");

                elem.value = value;
            }
        }

        private populateParams(setFocusOnLastOne: boolean = false) {
            var param: IParamContainerElement;
            var params = ge("params");

            // clean old set of params
            params.innerHTML = "";

            var longestName = 0, longestValue = 0, longestBoth = 0;

            var urlParams = this.url.params();
            for (var name in urlParams) {

                urlParams[name].forEach((value, valueIndex) => {
                    param = this.createNewParamContainer(name);
                    // check if param value is encoded
                    var isEncoded = paramEncodedPattern.test(value);

                    // parameter name field
                    param.nameElement.value = name;

                    // parameter value field
                    param.valueElement.value = isEncoded ? decodeURIComponent(value) : value;
                    param.valueElement["param-value-position"] = valueIndex;

                    // parameter encoded checkbox
                    if (isEncoded) {
                        var paramEncoded = <HTMLInputElement>param.valueElement.nextElementSibling;
                        paramEncoded.checked = true;
                    }

                    // measuring
                    var nameWidth = this.getTextWidth(name);
                    if (nameWidth > longestName) {
                        longestName = nameWidth;
                    }
                    var valueWidth = this.getTextWidth(param.valueElement.value);
                    if (valueWidth > longestValue) {
                        longestValue = valueWidth;
                    }
                    var bothWidth = nameWidth + valueWidth;
                    if (bothWidth > longestBoth) {
                        longestBoth = bothWidth;
                    }

                    params.appendChild(param);
                });
            }

            longestBoth += paramsMarginSum;
            if (longestBoth > params.clientWidth) {
                this.doc.body.style.width = Math.min(longestBoth, maxClientWidth) + "px";
            }

            if (setFocusOnLastOne && param) {
                param.nameElement.focus();
            }
        }

        private createNewParamContainer(name?: string): IParamContainerElement {
            var param = <IParamContainerElement>document.createElement("div");
            param.className = "param";
            // we need to encode param name as it may contain invalid chars for url
            // the default value is specified to prevent from addiong this param to the url object
            param["param-name"] = encodeURIComponent(name) || "--";
            param.innerHTML = '<input type="text" name="name" class="name" autocomplete="off" /> <input type="text" name="value" class="value" autocomplete="off" /> <input type="checkbox" title="Encode / decode" /> <input type="button" value="x" />';

            // parameter name field
            param.nameElement = <HTMLInputElement>param.firstElementChild;
            // parameter value field
            param.valueElement = <HTMLInputElement>param.nameElement.nextElementSibling;
            // encode element
            param.encodeElement = <HTMLInputElement>param.valueElement.nextElementSibling;

            param.isParamContainer = true;

            return param;
        }

        private deleteParam(elem: IParamContainerElement) {

            // set focus on previous param
            if (elem.previousElementSibling) {
                (<IParamContainerElement>elem.previousElementSibling).nameElement.focus();
            }
            
            elem.parentElement.removeChild(elem);
            this.setUriFromFields();
            this.updateFields();
        }

        private isTextFieldActive(): boolean {
            // check if tag is an INPUT or TEXTAREA, additionally check if the INPUT type is text
            return this.doc.activeElement && this.doc.activeElement.tagName == "INPUT" && this.doc.activeElement["type"] == "text";
        }

        private setErrorMessage(err: string, elem?: HTMLElement) {
            // setting error message
            ge("err").textContent = err ? "Error: " + err : "";

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

        private getTextWidth(text: string): number {
            this.measureElem.textContent = text;
            return this.measureElem.offsetWidth;
        }

        private keyboardNavigation(evt: KeyboardEvent): boolean {

            switch (evt.keyCode) {
                case 9: // tab
                    return true;
                case 187: // = (+)
                    // add new param
                    if (evt.ctrlKey) {
                        Tracking.trackEvent(Tracking.Category.AddParam, "keyboard");
                        this.addNewParamFields();
                        return true;
                    }
                    break;
                case 189: // -
                    // delete current param
                    if (evt.ctrlKey) {
                        var parent = <IParamContainerElement>(<HTMLInputElement>evt.target).parentElement;
                        // check if it is a param container element
                        if (parent && parent.isParamContainer) {
                            Tracking.trackEvent(Tracking.Category.RemoveParam, "keyboard");
                            this.deleteParam(<IParamContainerElement>parent);
                            return true;
                        }
                    }
                    break;
                case 79: // o
                    if (evt.ctrlKey) {
                        Tracking.trackEvent(Tracking.Category.Navigate, "keyboard", "options_page");
                        if (chrome.runtime.openOptionsPage) {
                            chrome.runtime.openOptionsPage();
                        }
                        else {
                            window.open(chrome.runtime.getURL("options.html"));
                        }
                    }
                    break;
            }

            var elem = <HTMLInputElement>evt.target;
            if (evt.ctrlKey && [37, 38, 39, 40].indexOf(evt.keyCode) != -1) {
                var nextElem: HTMLInputElement;
                Tracking.trackEvent(Tracking.Category.Navigate, "keyboard", "fields");
                switch (evt.keyCode) {
                    case 38: // up
                        var nextContainer = elem.parentElement.previousElementSibling;
                        // we need to handle case when user would like to go from params collection to basic fields
                        if (elem.parentElement.parentElement.id == "params" && !nextContainer) {
                            nextContainer = elem.parentElement.parentElement.previousElementSibling;
                        }
                        nextElem = this.getElementInTheSameColumn<HTMLInputElement>(elem, <HTMLElement>nextContainer);
                        break;
                    case 40: // down
                        var nextContainer = elem.parentElement.nextElementSibling;
                        // we need to handle case when user would like to go from basic fields to params collection
                        if (nextContainer && nextContainer.id == "params") {
                            nextContainer = nextContainer.firstElementChild;
                        }
                        nextElem = this.getElementInTheSameColumn<HTMLInputElement>(elem, <HTMLElement>nextContainer);
                        break;
                    case 37: // left
                        nextElem = <HTMLInputElement>elem.previousElementSibling;
                        break;
                    case 39: // right
                        nextElem = <HTMLInputElement>elem.nextElementSibling;
                        break;
                }
                
                evt.preventDefault();

                if (nextElem && this.formTextElements.indexOf(nextElem.tagName) != -1) {
                    nextElem.focus();
                }
                
                return true;
            }

            return false;
        }

        private getElementInTheSameColumn<T>(currentElem: HTMLElement, container: HTMLElement): T {
            if (currentElem && container) {
                var index = getIndexOfSiblingGivenType(currentElem, this.formTextElements);
                return <any>findNthElementOfType(container, this.formTextElements, index);
            }
        }

        private addNewParamFields() {
            var container = this.createNewParamContainer()
            ge("params").appendChild(container);

            (<HTMLInputElement>container.firstElementChild).focus();
        }

        private setUriFromFields() {
            var currentInput = <HTMLInputElement>this.doc.activeElement;

            if (currentInput) {
                var func = this.mapIdToFunction[currentInput.id];
                if (func) {
                    this.url[func](currentInput.value);
                }
                else {
                    var params: IMap<string[]> = {};

                    var container = ge("params");

                    [].forEach.call(container.childNodes, (child: IParamContainerElement) => {
                        if (child.nameElement && child.nameElement.value != "") {
                            // make sure it exists
                            params[child.nameElement.value] = params[child.nameElement.value] || [];

                            // add value to collection
                            var value = child.encodeElement.checked ? encodeURIComponent(child.valueElement.value) : child.valueElement.value;
                            params[child.nameElement.value].push(value);
                        }
                    });

                    this.url.params(params);
                }
            } // if
            
        } // function
    } // class

    interface IParamContainerElement extends HTMLDivElement {
        nameElement?: HTMLInputElement;
        valueElement?: HTMLInputElement;
        encodeElement?: HTMLInputElement;
        isParamContainer?: boolean;
    }
} // module