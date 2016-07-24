var UrlParser;
(function (UrlParser) {
    var AutoSuggest = (function () {
        function AutoSuggest(settings, doc, baseUrl) {
            var _this = this;
            this.settings = settings;
            this.baseUrl = new UrlParser.Uri(baseUrl.url());
            // initialize suggestions container
            this.suggestions = new Suggestions(doc);
            // bind event handlers
            document.body.addEventListener("DOMFocusOut", function (evt) {
                _this.suggestions.hide();
            });
            document.body.addEventListener("DOMFocusIn", function (evt) { return _this.onDomEvent(evt.target); });
            document.body.addEventListener("input", function (evt) { return _this.onDomEvent(evt.target); });
        }
        AutoSuggest.prototype.onSubmission = function (submittedUri) {
            var _this = this;
            if (this.settings.autoSuggestSaveNew && this.parsedData) {
                // compute differences and save new params
                var baseParams = this.baseUrl.params();
                var newParams = submittedUri.params();
                var baseParamNames = Object.keys(baseParams);
                var newParamNames = Object.keys(newParams);
                var diffNames = newParamNames.filter(function (newParam) { return baseParamNames.indexOf(newParam) < 0; });
                if (diffNames.length > 0) {
                    var pageName = submittedUri.hostname();
                    // make sure that page entry is set
                    this.parsedData[pageName] = this.parsedData[pageName] || {};
                    var existingNames = Object.keys(this.parsedData[pageName]);
                    diffNames.forEach(function (newParam) {
                        if (existingNames.indexOf(newParam) == -1) {
                            _this.parsedData[pageName][newParam] = [];
                        }
                        // remove if exists currently
                        _this.parsedData[pageName][newParam] = _this.parsedData[pageName][newParam].filter(function (val) { return val != newParam; });
                        // add on the beginning
                        _this.parsedData[pageName][newParam].unshift(newParams[newParam]);
                    });
                    // save in settings
                    this.settings.setValue("autoSuggestData", JSON.stringify(this.parsedData));
                }
                // create new Uri object to avoid keeping same reference
                this.baseUrl = new UrlParser.Uri(submittedUri.url());
            }
        };
        AutoSuggest.prototype.onDomEvent = function (elem) {
            if (elem.tagName == "INPUT" && elem.type == "text" && elem.parentElement["param-name"]) {
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
                    this.suggestions.show(elem);
                }
            }
        };
        return AutoSuggest;
    })();
    UrlParser.AutoSuggest = AutoSuggest;
    var Suggestions = (function () {
        function Suggestions(doc) {
            this.doc = doc;
            this.container = doc.createElement("ul");
            this.container.className = "suggestions";
            this.doc.body.appendChild(this.container);
        }
        Suggestions.prototype.add = function (text) {
            var li = this.doc.createElement("li");
            li.textContent = text;
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
                this.container.style.top = (pos.bottom - 3) + "px";
                this.container.style.left = pos.left + "px";
                this.container.style.display = "block";
                this.container.style.width = elem.offsetWidth + "px";
                this.elem = elem;
                this.originalText = this.elem.value;
                // we need to wrap it to be able to remove it later
                this.handler = function (evt) { return _this.keyboardNavigation(evt); };
                this.elem.addEventListener("keydown", this.handler, true);
            }
        };
        Suggestions.prototype.hide = function () {
            this.container.style.display = "none";
            if (this.elem) {
                this.elem.removeEventListener("keydown", this.handler, true);
                this.elem = undefined;
            }
            this.active = undefined;
        };
        Suggestions.prototype.keyboardNavigation = function (evt) {
            var _this = this;
            var handled;
            var elementToFocus;
            // allow user to navigate to other input elem
            if (evt.ctrlKey) {
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
                        this.originalText = this.active.textContent;
                        var nextInput = this.elem.nextElementSibling;
                        if (nextInput.tagName == "INPUT" && nextInput.type == "text") {
                            elementToFocus = nextInput;
                        }
                        else {
                            // hack: close suggestions pane when no next element
                            setTimeout(function () { return _this.hide(); }, 1);
                        }
                        var e = new Event("updated");
                        e.initEvent("updated", true, true);
                        this.elem.dispatchEvent(e);
                    }
                    break;
                case 27:
                    handled = true;
                    // delay hiding to properly execute remaining code
                    setTimeout(function () { return _this.hide(); }, 1);
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
        };
        return Suggestions;
    })();
})(UrlParser || (UrlParser = {}));
