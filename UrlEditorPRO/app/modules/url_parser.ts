/// <reference path="shared_interfaces.d.ts" />

module UrlEditor {

    var paramPattern = /([^\?=&]+)=([^\?&]*)/g; // consider to change it to /(?:\?|&(?:amp;)?)([^=&#]+)(?:=?([^&#]*))/g
    var prefixPattern = /^([a-zA-Z0-9-]+:)http/;

    export class Uri {
        private anchor: HTMLAnchorElement;
        private urlPrefix: string = ""; // like view-source:

        public static HighlightMarker = "|";

        constructor(uri: string) {
            this.anchor = document.createElement('a');
            this.url(uri);
        }

        private getSet(value: any, propertyName: string) {
            // check whether to set or return a value
            if (value == undefined) {
                return this.anchor[propertyName];
            }

            this.anchor[propertyName] = value;
        }

        protocol(value?: string): string {
            return this.getSet(value, "protocol");
        }

        hostname(value?: string): string {
            return this.getSet(value, "hostname");
        }

        port(value?: number): number {
            var result = this.getSet(value, "port");
            return result ? parseInt(result) : undefined;
        }
        
        pathname(value?: string): string {
            return this.getSet(value, "pathname");
        }

        query(value?: string): string {
            return this.getSet(value, "search");
        }

        hash(value?: string): string {
            return this.getSet(value, "hash");
        }

        host(value?: string): string {
            var current = this.getSet(undefined, "host");;
            if (value == undefined) {
                return current
            }
            
            // sometimes port number stays in the url - we need to be sure that it won't be in the final url when it is not needed
            if (this.getSet(undefined, "port") == "0" && value.indexOf(":") == -1) {
                value += ":80"; // set default http port number (it will disappear on final url)
            }
            return this.getSet(value, "host");
        }

        params(value?: IMap<string[]>): IMap<string[]> {
            // check whether we should set or return value
            if (value == undefined) {

                var params: IMap<string[]> = {}
                var match: string[];

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

                    value[name].forEach(val => {
                        search += search ? "&" : "";
                        search += name + "=" + val;
                    });
                }

                if (search) {
                    search = "?" + search;
                }

                this.anchor.search = search;
            }
        }

        url(url?: string): string {
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
        }

        getHighlightedUrl(cursorPos: number): string {
            var fullUrl = this.url();

            var queryLength = this.anchor.search.length;
            var pathLength = this.anchor.pathname.length;
            var hostLenght = this.anchor.href.length - queryLength - pathLength - this.anchor.hash.length;

            if (cursorPos <= hostLenght) {
                // cursor somewhere in the beginning of the url / host part
                fullUrl = `${Uri.HighlightMarker}${fullUrl.substr(0, hostLenght)}${Uri.HighlightMarker}${fullUrl.substr(hostLenght)}`;
            }
            else if (cursorPos <= hostLenght + pathLength) {
                // cursor somewhere in the path
                fullUrl = `${fullUrl.substr(0, hostLenght)}${Uri.HighlightMarker}${this.anchor.pathname}${Uri.HighlightMarker}${fullUrl.substr(hostLenght + pathLength)}`;
            }
            else if (cursorPos <= hostLenght + pathLength + queryLength) {
                // cursor somewhere in query area
                fullUrl = fullUrl.replace(paramPattern, (match: string, paramName: string, paramValue: string, offset: number) => {
                    // check if we should higlight this param
                    if (cursorPos >= offset && cursorPos <= offset + paramName.length + paramValue.length + 1) {
                        match = `${Uri.HighlightMarker}${paramName}${Uri.HighlightMarker}=${Uri.HighlightMarker}${paramValue}${Uri.HighlightMarker}`;
                    }

                    return match;
                });
            }

            return fullUrl;
        }
    }
}