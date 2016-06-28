

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
}