var UrlParser;
(function (UrlParser) {
    var paramPattern = /([^\?=&]+)=([^\?=&]+)/g;
    var prefixPattern = /^([a-zA-Z0-9-]+:)http/;
    var Uri = (function () {
        function Uri(uri) {
            this.urlPrefix = ""; // like view-source:
            this.anchor = document.createElement('a');
            this.url(uri);
        }
        Uri.prototype.getSet = function (value, propertyName) {
            // check whether to set or return a value
            if (value == undefined) {
                return this.anchor[propertyName];
            }
            this.anchor[propertyName] = value;
        };
        Uri.prototype.protocol = function (value) {
            return this.getSet(value, "protocol");
        };
        Uri.prototype.hostname = function (value) {
            return this.getSet(value, "hostname");
        };
        Uri.prototype.port = function (value) {
            var result = this.getSet(value, "port");
            return result ? parseInt(result) : undefined;
        };
        Uri.prototype.pathname = function (value) {
            return this.getSet(value, "pathname");
        };
        Uri.prototype.query = function (value) {
            return this.getSet(value, "search");
        };
        Uri.prototype.hash = function (value) {
            return this.getSet(value, "hash");
        };
        Uri.prototype.host = function (value) {
            var current = this.getSet(undefined, "host");
            ;
            if (value == undefined) {
                return current;
            }
            // sometimes port number stays in the url - we need to be sure that it won't be in the final url when it is not needed
            if (this.getSet(undefined, "port") == "0" && value.indexOf(":") == -1) {
                value += ":80"; // set default http port number (it will disappear on final url)
            }
            return this.getSet(value, "host");
        };
        Uri.prototype.params = function (value) {
            // check whether we should set or return value
            if (value == undefined) {
                var params = {};
                var matches = this.anchor.search.match(paramPattern);
                if (matches) {
                    // matches are concatenated params withvalues e.g. ["name=value", "name2=value2"]
                    matches.forEach(function (param) {
                        var nameValue = param.split("=", 2);
                        if (nameValue.length == 2) {
                            params[nameValue[0]] = nameValue[1];
                        }
                    });
                }
                return params;
            }
            else {
                var search = "";
                for (var name in value) {
                    search += search ? "&" : "";
                    search += name + "=" + value[name];
                }
                if (search) {
                    search = "?" + search;
                }
                this.anchor.search = search;
            }
        };
        Uri.prototype.url = function (url) {
            if (url == undefined) {
                // return regular url with prefix (like 'view-source:')
                return this.urlPrefix + this.anchor.href;
            }
            var matches = url.match(prefixPattern);
            if (matches && matches.length > 1) {
                this.urlPrefix = matches[1];
                // remove prefix from the url before passing it to anchor elem
                url = url.replace(prefixPattern, "http");
            }
            else {
                this.urlPrefix = "";
            }
            this.anchor.href = url;
        };
        return Uri;
    })();
    UrlParser.Uri = Uri;
})(UrlParser || (UrlParser = {}));
