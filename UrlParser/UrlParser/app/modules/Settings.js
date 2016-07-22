var UrlParser;
(function (UrlParser) {
    var storageCache = {};
    var Settings = (function () {
        function Settings(storage) {
            var _this = this;
            /**
            * Current borwser action icon
            */
            this.icon = "img/edit.png";
            /**
            * Whether to hide action pane after submission
            */
            this.autoHide = true;
            /**
            * Whether to show parameter suggestions
            */
            this.autoSuggest = true;
            /**
            * Whether to save new parameters to suggest them in the future
            */
            this.autoSuggestSaveNew = true;
            /**
            * Params suggestion data. We keep it as a string to prevent from parsing it on the initialization.
            */
            this.autoSuggestData = '{ "www.bing.com": { "uncrunched": [ "1", "0" ], "format": ["pbxml", "pbhtml", "aqm"], "addfeaturesnoexpansion": ["sup052", "entitiesaqr"] }}';
            storageCache = storage;
            Object.keys(this).forEach(function (key) {
                // check if property is not inherited
                if (_this.hasOwnProperty(key) &&
                    // check if someone is not trying to overwrite function
                    name != "saveValue" &&
                    // check if it is defined on storage already
                    storage[key] != undefined) {
                    // all the values in WebStorage are strings if the original value is not a string it means that we need to parse
                    _this[key] = typeof _this[key] == "string" ? storage[key] : JSON.parse(storage[key]);
                }
            });
        }
        Settings.prototype.setValue = function (name, value) {
            // check if name is valid
            if (name == "saveValue" || !this.hasOwnProperty(name)) {
                throw "Invalid setting name";
            }
            // save value in storage (note that WebStorage can only store strings
            storageCache[name] = typeof this[name] == "string" ? value : JSON.stringify(value);
            // update value in the current object
            this[name] = value;
        };
        return Settings;
    })();
    UrlParser.Settings = Settings;
})(UrlParser || (UrlParser = {}));
