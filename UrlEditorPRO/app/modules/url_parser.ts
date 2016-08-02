

module UrlEditor {

    var paramPattern = /([^\?=&]+)=([^\?&]*)/g; // consider to change it to /(?:\?|&(?:amp;)?)([^=&#]+)(?:=?([^&#]*))/g
    var prefixPattern = /^([a-zA-Z0-9-]+:)http/;

    export class Uri {
        private anchor: HTMLAnchorElement;
        private urlPrefix: string = ""; // like view-source:

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

        params(value?: IMap): IMap {
            // check whether we should set or return value
            if (value == undefined) {

                var params: IMap = {}
                var match: string[];

                while (match = paramPattern.exec(this.anchor.search)) {
                    params[match[1]] = match[2];
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
    }
}