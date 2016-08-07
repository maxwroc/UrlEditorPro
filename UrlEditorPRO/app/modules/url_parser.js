/// <reference path="shared_interfaces.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    var paramPattern = /([^\?=&]+)=([^\?&]*)/g; // consider to change it to /(?:\?|&(?:amp;)?)([^=&#]+)(?:=?([^&#]*))/g
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
                var match;
                while (match = paramPattern.exec(this.anchor.search)) {
                    // initialize with empty array if doesn't exist already
                    params[match[1]] = params[match[1]] || [];
                    params[match[1]].push(match[2]);
                }
                return params;
            }
            else {
                var search = "";
                for (var name in value) {
                    if (value[name].length == 0) {
                        // add empty string as a value otherwise param won't be added
                        value[name].push("");
                    }
                    value[name].forEach(function (val) {
                        search += search ? "&" : "";
                        search += name + "=" + val;
                    });
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
    }());
    UrlEditor.Uri = Uri;
})(UrlEditor || (UrlEditor = {}));
