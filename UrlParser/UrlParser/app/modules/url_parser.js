var UrlParser;
(function (UrlParser) {
    var paramPattern = /([^\?=&]+)=([^\?=&]+)/g;
    function parseUrl(url) {
        var parser = document.createElement('a');
        parser.href = url; // http://example.com:3000/pathname/?search=test#hash
        var params = {};
        var matches = parser.search.match(paramPattern);
        if (matches) {
            matches.forEach(function (param) {
                var nameValue = param.split("=", 2);
                if (nameValue.length == 2) {
                    params[nameValue[0]] = nameValue[1];
                }
            });
        }
        return {
            protocol: parser.protocol,
            hostname: parser.hostname,
            port: parseInt(parser.port),
            pathname: parser.pathname,
            query: parser.search,
            hash: parser.hash,
            host: parser.host,
            params: params
        };
    }
    UrlParser.parseUrl = parseUrl;
    var Uri = (function () {
        function Uri(uri) {
            this.anchor = document.createElement('a');
            this.anchor.href = uri;
        }
        Uri.prototype.getSet = function (value, propertyName) {
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
            return this.getSet(value, "host");
        };
        Uri.prototype.params = function (value) {
            if (value == undefined) {
                var params = {};
                var matches = this.anchor.search.match(paramPattern);
                if (matches) {
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
                    this.anchor.search = "?" + search;
                }
            }
        };
        Uri.prototype.url = function (url) {
            if (url == undefined) {
                return this.anchor.href;
            }
            this.anchor.href = url;
        };
        return Uri;
    })();
    UrlParser.Uri = Uri;
})(UrlParser || (UrlParser = {}));
