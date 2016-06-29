

module UrlParser {

    var paramPattern = /([^\?=&]+)=([^\?=&]+)/g;

    export function parseUrl(url: string): IParsedUrl {
        var parser = document.createElement('a');
        parser.href = url; // http://example.com:3000/pathname/?search=test#hash

        var params: IMap = {}
        var matches = parser.search.match(paramPattern);
        if (matches) {
            matches.forEach(param => {
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

    export class Uri {
        private anchor: HTMLAnchorElement;

        constructor(uri: string) {
            this.anchor = document.createElement('a');
            this.anchor.href = uri;
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

        hostname(value: string): string {
            return this.getSet(value, "hostname");
        }

        port(value: number): number {
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
                    search += name + "=" + value[name];
                }

                if (search) {
                    this.anchor.search = "?" + search;
                }
            }
        }

        url(): string {
            return this.anchor.href;
        }
    }
}