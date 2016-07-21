var UrlParser;
(function (UrlParser) {
    var AutoSuggest = (function () {
        function AutoSuggest(settings, doc) {
            this.settings = settings;
            // bind event handlers
        }
        AutoSuggest.prototype.showSuggestions = function (elem) {
            // check if auto-suggest functionality is enabled
            if (!this.settings.autoSuggest) {
                return;
            }
            // parse the data if it wasn't already
            if (this.parsedData == undefined) {
                this.parsedData = JSON.parse(this.settings.autoSuggestData);
            }
        };
        return AutoSuggest;
    })();
    UrlParser.AutoSuggest = AutoSuggest;
})(UrlParser || (UrlParser = {}));
