/// <reference path="shared_interfaces.d.ts" />
module UrlEditor {

    var paramEncodedPattern = /%[a-fA-F0-9]{2}/;
    var port80Pattern = /:80$/;
    var maxClientWidth = 780;
    var paramsMarginSum = 86; //5 * 4 + 2 * 3 + 2 * 22 + 2 * 8;
    
    /**
     * Returns following results for given params
     * 0 (CurrentTab) <- false, false
     * 1 (NewTab)     <- true,  false
     * 2 (NewWindow)  <- false, true
     * 2 (NewWindow)  <- true,  true
     */
    function whereToOpenUrl(o1: boolean, o2: boolean): OpenIn {
        // :)
        return (1 * <any>o1) + (2 * <any>o2) - (<any>o1 & <any>o2);
    }

    export class ViewModel {

        private mapIdToFunction: IStringMap = {
            "full_url": "url",
            "hostname": "host",
            "path": "pathname"
        };

        private measureElem: HTMLSpanElement;

        constructor(private url: Uri, private doc: HTMLDocument, settings: Settings, private submit: (uri: Uri, openIn: OpenIn) => void) {


            this.measureElem = Helpers.ge<HTMLSpanElement>("measure");

            // bind event handlers
            doc.body.addEventListener("click", evt => this.clickEventDispatcher(evt));
            doc.body.addEventListener("input", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("updated", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("keydown", evt => {
                
                if (this.keyboardNavigation(evt)) {
                    return;
                }

                if (Helpers.isTextFieldActive() && evt.keyCode == 13) {
                    Tracking.trackEvent(Tracking.Category.Submit, "keyboard");
                    submit(this.url, whereToOpenUrl(evt.ctrlKey, evt.shiftKey));
                    // we don't want a new line to be added in full_url input
                    evt.preventDefault();
                }
            });

            if (settings.autoSortParams) {
                this.sortParameters();
            }

            this.updateFields(false/*setUriFromFields*/);

            // initialize param options
            ParamOptions.init(document);
        }

        private clickEventDispatcher(evt: MouseEvent) {
            let elem = <HTMLElement>evt.target;

            // make sure ParamOptions menu is closed
            ParamOptions.hide();

            if (elem.tagName == "INPUT") {
                var inputElem = <HTMLInputElement>elem;
                switch (inputElem.type) {
                    case "button":
                        this.buttonClickHandler(inputElem, evt);
                        break;
                }
            }
        }

        private encodeDecodeParamValue(paramContainer: IParamContainerElement, base64: boolean) {
            let value = paramContainer.valueElement.value;
            if (base64) {
                let wasEncoded = Helpers.isBase64Encoded(value);
                    paramContainer.valueElement.value = wasEncoded ? Helpers.b64DecodeUnicode(value) : Helpers.b64EncodeUnicode(value);

                    paramContainer.base64Encoded = !wasEncoded;
            }
            else {
                // if it is encoded already we should decode it
                if (paramContainer.urlEncoded) {
                    paramContainer.valueElement.value = decodeURIComponent(value);
                }
                else {
                    paramContainer.valueElement.value = this.encodeURIComponent(value);
                }

                paramContainer.urlEncoded = !paramContainer.urlEncoded;
            }

            // delay execution
            setTimeout(() => {
                paramContainer.valueElement.focus();
                this.updateFields(true/*setUriFromFields*/);
            }, 0);
        }

        private buttonClickHandler(elem: HTMLInputElement, evt: MouseEvent) {
            // this handler is triggered for any button click on page

            var paramContainer = <IParamContainerElement>elem.parentElement;
            if (paramContainer.isParamContainer) {

                ParamOptions.show(this.getParamOptions(paramContainer), elem, /*openingByKeyboard*/evt.clientX == 0 && evt.clientY == 0);
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
                        this.submit(this.url, whereToOpenUrl(evt.ctrlKey, evt.shiftKey));
                        break;
                }
            }
        }

        private getParamOptions(container: IParamContainerElement): IMap<ParamOptions.IParamOption> {
            return {};
        }

        private keyboardEventDispatcher(evt: Event) {
            // casting to the INPUT elem but it can be a div/full_url as well
            var elem = <HTMLInputElement>evt.target;

            if (Helpers.isTextFieldActive()) {
                // clear error message
                this.setErrorMessage("", elem);
                
                this.updateFields();
            }
        }

        private updateFields(setUriFromFields = true) {
            if (setUriFromFields) {
                this.setUriFromFields();
            }

            var activeElem = <HTMLElement>this.doc.activeElement;
            var isTextFieldActive = Helpers.isTextFieldActive();

            if (activeElem.id == "full_url" || (!(<IParamContainerElement>activeElem.parentElement).isParamContainer && !isTextFieldActive)) {
                this.populateInputFields(!isTextFieldActive);
            }

            if (activeElem.id != "full_url" || !isTextFieldActive) {
                Helpers.ge<HTMLDivElement>("full_url").textContent = this.url.url();

                if (activeElem.id == "hostname") {
                    this.adjustElementWidthToItsContent(activeElem);
                }
            }
        }

        private populateInputFields(setFocusOnLastParam: boolean = false) {
            // iterate over elements which should be populatad
            var elements = this.doc.getElementsByTagName("input");
            for (var i = 0, elem; elem = <HTMLInputElement>elements[i]; i++) {
                var funcName = this.mapIdToFunction[elem.id];
                // check if element has ID set, the mapping exists 
                if (elem.id && funcName) {
                    // updating element value using a function name taken from mapping
                    this.setValueIfNotActive(elem, this.url[funcName]());

                    if (funcName == "host") {
                        // measure width and set fixed size (to make more space for path)
                        this.adjustElementWidthToItsContent(elem);
                    }
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
            var params = Helpers.ge<HTMLDivElement>("params");

            // clean old set of params
            params.innerHTML = "";

            var longestName = 0, longestValue = 0, longestBoth = 0;

            var urlParams = this.url.params();
            for (var name in urlParams) {

                urlParams[name].forEach((value, valueIndex) => {
                    name = decodeURIComponent(name);
                    param = this.createNewParamContainer(name); 

                    // parameter name field
                    param.nameElement.value = name;
                    
                    param.urlEncoded = paramEncodedPattern.test(value);

                    // parameter value field
                    param.valueElement.value = param.urlEncoded ? decodeURIComponent(value) : value;
                    param.valueElement["param-value-position"] = valueIndex;

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

            if (setFocusOnLastOne) {
                if (param) {
                    param.nameElement.focus();
                }
                else {
                    Helpers.ge<HTMLInputElement>("hostname").focus();
                }
            }
        }

        private createNewParamContainer(name?: string): IParamContainerElement {
            var param = <IParamContainerElement>document.createElement("div");
            param.className = "param";
            param.innerHTML = '<input type="text" name="name" class="name" autocomplete="off" spellcheck="false" /> <input type="text" name="value" class="value" autocomplete="off" spellcheck="false" /> <input type="button" value="x" />';

            // parameter name field
            param.nameElement = <HTMLInputElement>param.firstElementChild;
            // parameter value field
            param.valueElement = <HTMLInputElement>param.nameElement.nextElementSibling;

            param.isParamContainer = true;

            return param;
        }

        private deleteParam(elem: IParamContainerElement) {

            // try to get next or previous param container
            var paramToFocus = <IParamContainerElement>elem.nextElementSibling || <IParamContainerElement>elem.previousElementSibling;
            if (paramToFocus) {
                paramToFocus.nameElement.focus();
            }
            
            elem.parentElement.removeChild(elem);
            this.updateFields();
        }

        private setErrorMessage(err: string, elem?: HTMLElement) {
            // setting error message
            Helpers.ge<HTMLDivElement>("err").textContent = err ? "Error: " + err : "";

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
            // spaces have to be replaced otherwise they won't increase the width
            this.measureElem.innerHTML = this.measureElem.innerHTML.replace(/ /g, "&nbsp;");
            return this.measureElem.offsetWidth;
        }

        private adjustElementWidthToItsContent(elem: HTMLElement) {
            var width = this.getTextWidth((<HTMLInputElement>elem).value || elem.textContent) + 12; // + 10 padding and +2 border 
            elem.style.width = width + "px";
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
                case 66: // b
                    if (evt.ctrlKey && Helpers.isTextFieldActive()) {
                        var parent = <IParamContainerElement>(<HTMLInputElement>evt.target).parentElement;
                        // check if it is a param container element
                        if (parent && parent.isParamContainer) {
                            Tracking.trackEvent(Tracking.Category.Encoding, "keyboard", "base64");

                            var input = <HTMLInputElement>evt.target;
                            input.value = Helpers.isBase64Encoded(input.value) ? Helpers.b64DecodeUnicode(input.value) : Helpers.b64EncodeUnicode(input.value);
                            
                            this.updateFields();
                            return true;
                        }
                    }
                    break;
                case 83:
                    if (evt.ctrlKey) {
                        Tracking.trackEvent(Tracking.Category.Sort, "keyboard");
                        this.sortParameters();

                        // take focus of the input to trigger params refresh
                        (<HTMLInputElement>evt.target).blur();
                        this.updateFields(false/*setUriFromFields*/);
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

                        // if on full url field loop to the last available field on the bottom
                        if (!nextElem) {
                            let lastParamContainer = <IParamContainerElement>Helpers.ge("params").lastElementChild;
                            if (lastParamContainer) {
                                nextElem = lastParamContainer.nameElement;
                            }
                            else {
                                nextElem = Helpers.ge<HTMLInputElement>("hostname");
                            }
                        }

                        break;
                    case 40: // down
                        var nextContainer = elem.parentElement.nextElementSibling;
                        // we need to handle case when user would like to go from basic fields to params collection
                        if (nextContainer && nextContainer.id == "params") {
                            nextContainer = nextContainer.firstElementChild;
                        }
                        nextElem = this.getElementInTheSameColumn<HTMLInputElement>(elem, <HTMLElement>nextContainer);

                        // if on last param then loop to host or full url field
                        if (!nextElem) {
                            // take full url field if the current one is hostname
                            nextElem = Helpers.ge<HTMLInputElement>(elem.id == "hostname" ? "full_url" : "hostname");
                        }

                        break;
                    case 37: // left
                        nextElem = <HTMLInputElement>elem.previousElementSibling;
                        break;
                    case 39: // right
                        nextElem = <HTMLInputElement>elem.nextElementSibling;
                        break;
                }
                
                evt.preventDefault();

                if (nextElem) {
                    nextElem.focus();
                }
                
                return true;
            }

            return false;
        }

        private getElementInTheSameColumn<T>(currentElem: HTMLElement, container: HTMLElement): T {
            if (currentElem && container) {
                let textFieldElements = ["INPUT", "DIV"];
                let index = Helpers.getIndexOfSiblingGivenType(currentElem, textFieldElements);
                return <any>Helpers.findNthElementOfType(container, textFieldElements, index);
            }
        }

        private addNewParamFields() {
            var container = this.createNewParamContainer();
            // by default all new params are encoded
            container.urlEncoded = true;

            Helpers.ge("params").appendChild(container);

            (<HTMLInputElement>container.firstElementChild).focus();
        }

        private sortParameters() {
            var sortedParams: IMap<string[]> = {};
            var currentParams = this.url.params();
            Object.keys(currentParams).sort().forEach(name => {
                // sort values as well
                sortedParams[name] = currentParams[name].sort();
            });

            this.url.params(sortedParams);
        }

        private setUriFromFields() {
            let currentInput = <HTMLElement>this.doc.activeElement;

            if (currentInput) {
                let func = this.mapIdToFunction[currentInput.id];
                if (func) {
                    this.url[func](currentInput.tagName == "INPUT" ? (<HTMLInputElement>currentInput).value : currentInput.textContent);
                }
                else {
                    let params: IMap<string[]> = {};

                    let paramsWrapper = Helpers.ge("params");

                    [].forEach.call(paramsWrapper.childNodes, (container: IParamContainerElement) => {
                        if (container.nameElement && container.nameElement.value != "") {
                            let paramName = this.encodeURIComponent(container.nameElement.value);
                            // make sure it exists
                            params[paramName] = params[paramName] || [];
                            
                            let value = container.valueElement.value;

                            // force url-encoding if value contins ampersand
                            if (value.indexOf("&") != -1 && !container.base64Encoded) {
                                container.urlEncoded = true;
                            }

                            // check if we should encode it
                            if (container.urlEncoded) {
                                value = this.encodeURIComponent(value);
                            }
                            if (container.base64Encoded) {
                                if (Helpers.isBase64Encoded(value)) {
                                    // sometimes string can only look like a base64 encoded and in such cases exception can be thrown
                                    try {
                                        container.valueElement.value = Helpers.b64DecodeUnicode(value);
                                    }
                                    catch (e) {
                                        value = Helpers.b64EncodeUnicode(value);
                                    }
                                }
                                else {
                                    value = Helpers.b64EncodeUnicode(value);
                                }
                            }

                            params[paramName].push(value);
                        }
                    });

                    this.url.params(params);
                }
            } // if
            
        } // function

        /**
         * Does URI encoding but leaves "+"
         */
        private encodeURIComponent(value: string): string {
            return encodeURIComponent(value).replace(/%2B/g, "+");
        }
    } // class
} // module
