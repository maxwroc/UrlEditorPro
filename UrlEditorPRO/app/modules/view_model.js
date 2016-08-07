var UrlEditor;
(function (UrlEditor) {
    var paramEncodedPattern = /%[a-fA-F0-9]{2}/;
    var port80Pattern = /:80$/;
    var maxClientWidth = 780;
    var paramsMarginSum = 86; //5 * 4 + 2 * 3 + 2 * 22 + 2 * 8;
    var ViewModel = (function () {
        function ViewModel(url, doc, submit) {
            var _this = this;
            this.mapIdToFunction = {
                "full_url": "url",
                "hostname": "host",
                "path": "pathname"
            };
            this.formTextElements = ["INPUT", "TEXTAREA"];
            this.url = url;
            this.doc = doc;
            this.submit = submit;
            this.measureElem = UrlEditor.ge("measure");
            // bind event handlers
            doc.body.addEventListener("click", function (evt) { return _this.clickEventDispatcher(evt); });
            doc.body.addEventListener("input", function (evt) { return _this.keyboardEventDispatcher(evt); });
            doc.body.addEventListener("updated", function (evt) { return _this.keyboardEventDispatcher(evt); });
            doc.body.addEventListener("keydown", function (evt) {
                if (_this.keyboardNavigation(evt)) {
                    return;
                }
                if (_this.isTextFieldActive() && evt.keyCode == 13) {
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Submit, "keyboard");
                    submit(_this.url);
                    // we don't want a new line to be added in TEXTAREA
                    evt.preventDefault();
                }
            });
            this.updateFields();
        }
        ViewModel.prototype.clickEventDispatcher = function (evt) {
            var elem = evt.target;
            if (elem.tagName == "INPUT") {
                var inputElem = elem;
                switch (inputElem.type) {
                    case "checkbox":
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Encoding, "click", inputElem.checked.toString());
                        this.checkboxClickHandler(inputElem);
                        break;
                    case "button":
                        this.buttonClickHandler(inputElem);
                        break;
                }
            }
        };
        ViewModel.prototype.checkboxClickHandler = function (elem) {
            var valElem = elem.previousElementSibling;
            // we have only one checkbox for encoding/decoding value
            if (elem.checked) {
                valElem.value = decodeURIComponent(valElem.value);
            }
            else {
                valElem.value = encodeURIComponent(valElem.value);
            }
        };
        ViewModel.prototype.buttonClickHandler = function (elem) {
            // this handler is triggered for any button click on page
            var paramContainer = elem.parentElement;
            if (paramContainer.isParamContainer) {
                // this seems to be a delete param button so we're removing param
                this.deleteParam(paramContainer);
            }
            else {
                switch (elem.id) {
                    case "add_param":
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AddParam, "click");
                        this.addNewParamFields();
                        break;
                    case "go":
                        // submit button
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Submit, "click");
                        this.submit(this.url);
                        break;
                }
            }
        };
        ViewModel.prototype.keyboardEventDispatcher = function (evt) {
            // casting to the INPUT elem but it can be a TEXTAREA as well
            var elem = evt.target;
            if (this.isTextFieldActive()) {
                // clear error message
                this.setErrorMessage("", elem);
                this.setUriFromFields();
                this.updateFields();
            }
        };
        ViewModel.prototype.updateFields = function () {
            var activeElem = this.doc.activeElement;
            var isTextFieldActive = this.isTextFieldActive();
            if (activeElem.id == "full_url" || !isTextFieldActive) {
                this.populateInputFields(!isTextFieldActive);
            }
            if (activeElem.id != "full_url" || !isTextFieldActive) {
                UrlEditor.ge("full_url").value = this.url.url();
            }
        };
        ViewModel.prototype.populateInputFields = function (setFocusOnLastParam) {
            if (setFocusOnLastParam === void 0) { setFocusOnLastParam = false; }
            // iterate over elements which should be populatad
            var elements = this.doc.getElementsByTagName("input");
            for (var i = 0, elem; elem = elements[i]; i++) {
                // check if element has ID set, the mapping exists 
                if (elem.id && this.mapIdToFunction[elem.id]) {
                    // updating element value using a function name taken from mapping
                    this.setValueIfNotActive(elem, this.url[this.mapIdToFunction[elem.id]]());
                }
            }
            this.populateParams(setFocusOnLastParam);
        };
        ViewModel.prototype.setValueIfNotActive = function (elem, value) {
            // check if it isn't currently active element (we don't want to overwrite text which user might be typing still)
            if (elem != this.doc.activeElement) {
                // just in case we remove the error class
                elem.classList.remove("error");
                elem.value = value;
            }
        };
        ViewModel.prototype.populateParams = function (setFocusOnLastOne) {
            var _this = this;
            if (setFocusOnLastOne === void 0) { setFocusOnLastOne = false; }
            var param;
            var params = UrlEditor.ge("params");
            // clean old set of params
            params.innerHTML = "";
            var longestName = 0, longestValue = 0, longestBoth = 0;
            var urlParams = this.url.params();
            for (var name in urlParams) {
                urlParams[name].forEach(function (value, valueIndex) {
                    param = _this.createNewParamContainer(name);
                    // check if param value is encoded
                    var isEncoded = paramEncodedPattern.test(value);
                    // parameter name field
                    param.nameElement.value = name;
                    // parameter value field
                    param.valueElement.value = isEncoded ? decodeURIComponent(value) : value;
                    param.valueElement["param-value-position"] = valueIndex;
                    // parameter encoded checkbox
                    if (isEncoded) {
                        var paramEncoded = param.valueElement.nextElementSibling;
                        paramEncoded.checked = true;
                    }
                    // measuring
                    var nameWidth = _this.getTextWidth(name);
                    if (nameWidth > longestName) {
                        longestName = nameWidth;
                    }
                    var valueWidth = _this.getTextWidth(param.valueElement.value);
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
        };
        ViewModel.prototype.createNewParamContainer = function (name) {
            var param = document.createElement("div");
            param.className = "param";
            // we need to encode param name as it may contain invalid chars for url
            // the default value is specified to prevent from addiong this param to the url object
            param["param-name"] = encodeURIComponent(name) || "--";
            param.innerHTML = '<input type="text" name="name" class="name" autocomplete="off" /> <input type="text" name="value" class="value" autocomplete="off" /> <input type="checkbox" title="Encode / decode" /> <input type="button" value="x" />';
            // parameter name field
            param.nameElement = param.firstElementChild;
            // parameter value field
            param.valueElement = param.nameElement.nextElementSibling;
            // encode element
            param.encodeElement = param.valueElement.nextElementSibling;
            param.isParamContainer = true;
            return param;
        };
        ViewModel.prototype.deleteParam = function (elem) {
            // set focus on previous param
            if (elem.previousElementSibling) {
                elem.previousElementSibling.nameElement.focus();
            }
            elem.parentElement.removeChild(elem);
            this.setUriFromFields();
            this.updateFields();
        };
        ViewModel.prototype.isTextFieldActive = function () {
            // check if tag is an INPUT or TEXTAREA, additionally check if the INPUT type is text
            return this.doc.activeElement && this.doc.activeElement.tagName == "INPUT" && this.doc.activeElement["type"] == "text";
        };
        ViewModel.prototype.setErrorMessage = function (err, elem) {
            // setting error message
            UrlEditor.ge("err").textContent = err ? "Error: " + err : "";
            // if DOM element was passed we're setting or removing the error indicator color
            if (elem) {
                if (err) {
                    elem.classList.add("error");
                }
                else {
                    elem.classList.remove("error");
                }
            }
        };
        ViewModel.prototype.getTextWidth = function (text) {
            this.measureElem.textContent = text;
            return this.measureElem.offsetWidth;
        };
        ViewModel.prototype.keyboardNavigation = function (evt) {
            switch (evt.keyCode) {
                case 9:
                    return true;
                case 187:
                    // add new param
                    if (evt.ctrlKey) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AddParam, "keyboard");
                        this.addNewParamFields();
                        return true;
                    }
                    break;
                case 189:
                    // delete current param
                    if (evt.ctrlKey) {
                        var parent = evt.target.parentElement;
                        // check if it is a param container element
                        if (parent && parent.isParamContainer) {
                            UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.RemoveParam, "keyboard");
                            this.deleteParam(parent);
                            return true;
                        }
                    }
                    break;
                case 79:
                    if (evt.ctrlKey) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Navigate, "keyboard", "options_page");
                        if (chrome.runtime.openOptionsPage) {
                            chrome.runtime.openOptionsPage();
                        }
                        else {
                            window.open(chrome.runtime.getURL("options.html"));
                        }
                    }
                    break;
            }
            var elem = evt.target;
            if (evt.ctrlKey && [37, 38, 39, 40].indexOf(evt.keyCode) != -1) {
                var nextElem;
                UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Navigate, "keyboard", "fields");
                switch (evt.keyCode) {
                    case 38:
                        var nextContainer = elem.parentElement.previousElementSibling;
                        // we need to handle case when user would like to go from params collection to basic fields
                        if (elem.parentElement.parentElement.id == "params" && !nextContainer) {
                            nextContainer = elem.parentElement.parentElement.previousElementSibling;
                        }
                        nextElem = this.getElementInTheSameColumn(elem, nextContainer);
                        break;
                    case 40:
                        var nextContainer = elem.parentElement.nextElementSibling;
                        // we need to handle case when user would like to go from basic fields to params collection
                        if (nextContainer && nextContainer.id == "params") {
                            nextContainer = nextContainer.firstElementChild;
                        }
                        nextElem = this.getElementInTheSameColumn(elem, nextContainer);
                        break;
                    case 37:
                        nextElem = elem.previousElementSibling;
                        break;
                    case 39:
                        nextElem = elem.nextElementSibling;
                        break;
                }
                evt.preventDefault();
                if (nextElem && this.formTextElements.indexOf(nextElem.tagName) != -1) {
                    nextElem.focus();
                }
                return true;
            }
            return false;
        };
        ViewModel.prototype.getElementInTheSameColumn = function (currentElem, container) {
            if (currentElem && container) {
                var index = UrlEditor.getIndexOfSiblingGivenType(currentElem, this.formTextElements);
                return UrlEditor.findNthElementOfType(container, this.formTextElements, index);
            }
        };
        ViewModel.prototype.addNewParamFields = function () {
            var container = this.createNewParamContainer();
            UrlEditor.ge("params").appendChild(container);
            container.firstElementChild.focus();
        };
        ViewModel.prototype.setUriFromFields = function () {
            var currentInput = this.doc.activeElement;
            if (currentInput) {
                var func = this.mapIdToFunction[currentInput.id];
                if (func) {
                    this.url[func](currentInput.value);
                }
                else {
                    var params = {};
                    var container = UrlEditor.ge("params");
                    [].forEach.call(container.childNodes, function (child) {
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
        }; // function
        return ViewModel;
    }());
    UrlEditor.ViewModel = ViewModel; // class
})(UrlEditor || (UrlEditor = {})); // module
