

module UrlParser {

    var paramPattern = /([^\?=&]+)=([^\?=&]+)/g;
    var prefixPattern = /^([a-zA-Z0-9-]+:)http/;

    export class Uri {
        private anchor: HTMLAnchorElement;
        private urlPrefix: string = ""; // like view-source:

        constructor(uri: string) {
            this.anchor = document.createElement('a');
            this.url(uri);
        }

        private getSet(value: any, propertyName: string) {
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
            return this.getSet(value, "host");
        }

        params(value?: IMap): IMap {
            if (value == undefined) {

                var params: IMap = {}
                var matches = this.anchor.search.match(paramPattern);
                if (matches) {
                    matches.forEach(param => {
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
        }

        url(url?: string): string {
            if (url == undefined) {
                return this.urlPrefix + this.anchor.href;
            }
            
            var matches = url.match(prefixPattern);
            if (matches.length > 1) {
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