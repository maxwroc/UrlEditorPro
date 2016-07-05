var UrlParser;
(function (UrlParser) {
    var ViewModel = (function () {
        function ViewModel(url, doc) {
            var _this = this;
            this.formTextElements = ["INPUT", "TEXTAREA"];
            this.mapIdToFunction = {
                "full_url": "url",
                "hostname": "hostname",
                "path": "pathname"
            };
            this.url = url;
            this.doc = doc;
            doc.body.addEventListener("keyup", function (evt) { return _this.eventDispatcher(evt); });
            this.populateFieldsExceptActiveOne();
        }
        ViewModel.prototype.eventDispatcher = function (evt) {
            // casting to the INPUT elem but it can be a TEXTAREA as well
            var elem = evt.target;
            if (this.formTextElements.indexOf(elem.tagName) != -1) {
                // check if element has a special property
                if (elem.id && typeof this.mapIdToFunction[elem.id]) {
                    this.url[this.mapIdToFunction[elem.id]](elem.value);
                    this.populateFieldsExceptActiveOne();
                }
            }
        };
        ViewModel.prototype.populateFieldsExceptActiveOne = function () {
            var _this = this;
            // iterate over elements which should be populatad
            this.formTextElements.forEach(function (tagName) {
                var elements = _this.doc.getElementsByTagName(tagName);
                for (var i = 0, elem; elem = elements[i]; i++) {
                    // check if element has ID set, the mapping exists 
                    if (elem.id && _this.mapIdToFunction[elem.id]) {
                        // updating element value using a function name taken from mapping
                        _this.setValueIfNotActive(elem, _this.url[_this.mapIdToFunction[elem.id]]());
                    }
                }
            });
            // updating params only if there is no active element (probably this condition is redundant)
            if (!this.doc.activeElement ||
                // or if the active element is not one of the text fields
                this.formTextElements.indexOf(this.doc.activeElement.tagName) == -1 ||
                // or active element does not belong to param fields (and only if it is a full_url field)
                // second part of this condition is an optimization as for now we have only one text field which should trigger params population
                (!this.doc.activeElement["param-name"] && this.doc.activeElement.id == "full_url")) {
                this.populateParams();
            }
        };
        ViewModel.prototype.setValueIfNotActive = function (elem, value) {
            // check if it isn't currently active element (we don't want to overwrite text which user might be typing still)
            if (elem != this.doc.activeElement) {
                elem.value = value;
            }
        };
        ViewModel.prototype.populateParams = function () {
            var params = this.doc.getElementById("params");
            // clean old set of params
            params.innerHTML = "";
            var urlParams = this.url.params();
            for (var name in urlParams) {
                var param = this.createNewParamFields(name);
                // parameter name field
                var paramNameElem = param.firstElementChild;
                paramNameElem.value = name;
                // parameter value field
                var paramValue = paramNameElem.nextElementSibling;
                paramValue.value = urlParams[name];
                params.appendChild(param);
            }
        };
        ViewModel.prototype.createNewParamFields = function (name) {
            var param = document.createElement("div");
            param.className = "param";
            param["param-name"] = encodeURIComponent(name) || "--";
            param.innerHTML = '<input type="text" class="name" /> <input type="text" class="value" /> <input type="checkbox" title="Encode / decode" /> <input type="button" value="x" />';
            return param;
        };
        return ViewModel;
    })();
    UrlParser.ViewModel = ViewModel;
})(UrlParser || (UrlParser = {}));
