var UrlParser;
(function (UrlParser) {
    var AutoSuggest = (function () {
        function AutoSuggest(settings, doc, baseUrl) {
            var _this = this;
            this.settings = settings;
            this.baseUrl = baseUrl;
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
            // compute differences and save new params
            this.baseUrl = submittedUri;
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
                    suggestions = Object.keys(pageData[name]);
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
            this.container.setAttribute("style", "position: absolute; margin: 0; background-color: white; border: 1px solid gray; display: none; list-style: none; padding: 0 5px");
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
            // show only if there is anything to show
            if (this.container.innerHTML) {
                var pos = elem.getBoundingClientRect();
                this.container.style.top = pos.bottom + "px";
                this.container.style.left = pos.left + "px";
                this.container.style.display = "block";
            }
        };
        Suggestions.prototype.hide = function () {
            this.container.style.display = "none";
        };
        return Suggestions;
    })();
})(UrlParser || (UrlParser = {}));
