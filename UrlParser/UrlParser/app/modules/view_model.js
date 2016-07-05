var UrlParser;
(function (UrlParser) {
    var ViewModel = (function () {
        function ViewModel(url, doc) {
            var _this = this;
            this.formTextElements = ["INPUT", "TEXTAREA"];
            this.mapIdToProperty = {
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
                if (elem.id && typeof this.mapIdToProperty[elem.id]) {
                    this.url[this.mapIdToProperty[elem.id]](elem.value);
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
                    if (elem.id && _this.mapIdToProperty[elem.id]) {
                        // updating element value using a function name taken from mapping
                        _this.setValueIfNotActive(elem, _this.url[_this.mapIdToProperty[elem.id]]());
                    }
                }
            });
        };
        ViewModel.prototype.setValueIfNotActive = function (elem, value) {
            // check if it isn't currently active element (we don't want to overwrite text which user might be typing still)
            if (elem != this.doc.activeElement) {
                elem.value = value;
            }
        };
        return ViewModel;
    })();
    UrlParser.ViewModel = ViewModel;
})(UrlParser || (UrlParser = {}));
