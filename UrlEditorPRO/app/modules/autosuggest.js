var UrlEditor;
(function (UrlEditor) {
    var AutoSuggest = (function () {
        function AutoSuggest(settings, doc, baseUrl, isInIncognitoMode) {
            var _this = this;
            this.isInIncognitoMode = isInIncognitoMode;
            this.settings = settings;
            this.baseUrl = new UrlEditor.Uri(baseUrl.url());
            // initialize suggestions container
            this.suggestions = new Suggestions(doc, this);
            // bind event handlers
            document.body.addEventListener("DOMFocusOut", function (evt) {
                _this.suggestions.hide();
            });
            document.body.addEventListener("DOMFocusIn", function (evt) { return _this.onDomEvent(evt.target); });
            document.body.addEventListener("input", function (evt) { return _this.onDomEvent(evt.target); });
        }
        AutoSuggest.prototype.onSubmission = function (submittedUri) {
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
            var paramsToSave;
            Object.keys(submittedParams).forEach(function (name) {
                // add params to save list when they were just added
                if (baseParams[name] == undefined ||
                    // or their value is different than before
                    baseParams[name] != submittedParams[name]) {
                    // initilize collection whenever it is needed
                    paramsToSave = paramsToSave || {};
                    // take only values which were not saved previously
                    paramsToSave[name] = submittedParams[name].filter(function (val) { return !baseParams[name] || baseParams[name].indexOf(val) == -1; });
                }
            });
            if (paramsToSave) {
                var pageName = submittedUri.hostname();
                // make sure that the entry exists
                var pageData = this.parsedData[pageName] = this.parsedData[pageName] || {};
                Object.keys(paramsToSave).forEach(function (name) {
                    // make sure collection of values for parameter name exists
                    pageData[name] = pageData[name] || [];
                    // iterate over newly added param values
                    paramsToSave[name].forEach(function (val) {
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
            this.baseUrl = new UrlEditor.Uri(submittedUri.url());
        };
        AutoSuggest.prototype.deleteSuggestion = function (paramName, paramValue) {
            var pageName = this.baseUrl.hostname();
            if (this.parsedData && this.parsedData[pageName]) {
                if (paramValue != undefined) {
                    if (this.parsedData[pageName][paramName]) {
                        // remove suggestion from settings
                        this.parsedData[pageName][paramName] = this.parsedData[pageName][paramName].filter(function (val) { return val != paramValue; });
                    }
                }
                else {
                    delete this.parsedData[pageName][paramName];
                }
                this.settings.setValue("autoSuggestData", JSON.stringify(this.parsedData));
            }
        };
        AutoSuggest.prototype.onDomEvent = function (elem) {
            if (elem.tagName == "INPUT" && elem.type == "text" && elem.parentElement.isParamContainer) {
                var name, value;
                switch (elem.name) {
                    case "name":
                        name = elem.value;
                        break;
                    case "value":
                        name = elem.previousElementSibling.value;
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
        };
        AutoSuggest.prototype.showSuggestions = function (elem, name, value) {
            // check if auto-suggest functionality is enabled
            if (!this.settings.autoSuggest) {
                return;
            }
            // parse the data if it wasn't already
            if (this.parsedData == undefined) {
                this.parsedData = JSON.parse(this.settings.autoSuggestData);
            }
            var pageData = this.parsedData[this.baseUrl.hostname()];
            if (pageData) {
                var suggestions = [];
                var prefix;
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
                    this.suggestions.bulkAdd(suggestions.filter(function (text) {
                        // suggestion must be longer than prefix
                        return prefix.length < text.length &&
                            // and must start with prefix
                            text.substr(0, prefix.length) == prefix;
                    }));
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "shown");
                    this.suggestions.show(elem);
                }
            }
        };
        return AutoSuggest;
    }());
    UrlEditor.AutoSuggest = AutoSuggest;
    var Suggestions = (function () {
        function Suggestions(doc, autoSuggest) {
            var _this = this;
            this.doc = doc;
            this.autoSuggest = autoSuggest;
            this.container = doc.createElement("ul");
            this.container.className = "suggestions";
            this.doc.body.appendChild(this.container);
            // need to use mousedown as click event is triggered too late (after DOMFocusIn which is hidding suggestions)
            this.container.addEventListener("mousedown", function (evt) { return _this.mouseEventHandler(evt); });
        }
        Suggestions.prototype.add = function (text) {
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
        };
        Suggestions.prototype.bulkAdd = function (texts) {
            var _this = this;
            this.clear();
            texts.forEach(function (text) { return _this.add(text); });
        };
        Suggestions.prototype.clear = function () {
            this.container.innerHTML = "";
            this.hide();
        };
        Suggestions.prototype.show = function (elem) {
            var _this = this;
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
                this.handler = function (evt) { return _this.keyboardNavigation(evt); };
                this.inputElem.addEventListener("keydown", this.handler, true);
            }
        };
        Suggestions.prototype.hide = function () {
            this.container.style.display = "none";
            if (this.inputElem) {
                this.inputElem.removeEventListener("keydown", this.handler, true);
                this.inputElem = undefined;
            }
            this.active = undefined;
        };
        Suggestions.prototype.mouseEventHandler = function (evt) {
            var elem = evt.target;
            switch (elem.className) {
                case "suggestion":
                    this.inputElem.value = elem.suggestionText;
                    break;
                case "delete":
                    this.deleteSuggestion(elem.parentElement);
                    // prevent from triggering same event on suggestion
                    evt.stopPropagation();
                    // prevent from closing suggestions drawer
                    evt.preventDefault();
                    break;
            }
        };
        Suggestions.prototype.keyboardNavigation = function (evt) {
            var _this = this;
            var handled;
            var elementToFocus;
            // allow user to navigate to other input elem
            if (evt.ctrlKey && evt.keyCode != 68) {
                return;
            }
            var suggestionToSelect;
            switch (evt.keyCode) {
                case 38:
                    handled = true;
                    suggestionToSelect = this.active ? this.active.previousElementSibling : this.container.lastElementChild;
                    break;
                case 40:
                    handled = true;
                    suggestionToSelect = this.active ? this.active.nextElementSibling : this.container.firstElementChild;
                    break;
                case 9: // tab
                case 13:
                    if (this.active) {
                        handled = true;
                        this.originalText = this.active.suggestionText;
                        var nextInput = this.inputElem.nextElementSibling;
                        if (nextInput.tagName == "INPUT" && nextInput.type == "text") {
                            elementToFocus = nextInput;
                        }
                        else {
                            // hack: close suggestions pane when no next element
                            setTimeout(function () { return _this.hide(); }, 1);
                        }
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "used");
                        var e = new Event("updated");
                        e.initEvent("updated", true, true);
                        this.inputElem.dispatchEvent(e);
                    }
                    break;
                case 27:
                    handled = true;
                    // delay hiding to properly execute remaining code
                    setTimeout(function () { return _this.hide(); }, 1);
                    break;
                case 68:
                    if (evt.ctrlKey && this.active) {
                        this.deleteSuggestion(this.active);
                        handled = true;
                    }
                    break;
            }
            this.active && this.active.classList.remove("hv");
            if (suggestionToSelect) {
                UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "selected");
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
        };
        Suggestions.prototype.ensureIsVisible = function (suggestionElem) {
            var containerScrollTop = this.container.scrollTop;
            var suggestionElemOffsetTop = suggestionElem.offsetTop;
            var offsetBottom = suggestionElemOffsetTop + suggestionElem.offsetHeight;
            if (offsetBottom > containerScrollTop + this.container.offsetHeight) {
                this.container.scrollTop = offsetBottom - this.container.offsetHeight + 2; // increase due to border size
            }
            else if (suggestionElemOffsetTop < containerScrollTop) {
                this.container.scrollTop = suggestionElemOffsetTop;
            }
        };
        Suggestions.prototype.deleteSuggestion = function (suggestion) {
            var paramElem = this.inputElem.parentElement;
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
        };
        return Suggestions;
    }());
})(UrlEditor || (UrlEditor = {}));
