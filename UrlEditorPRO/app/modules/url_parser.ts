/// <reference path="shared_interfaces.d.ts" />

module UrlEditor {

    let paramPattern = /(?:\?|&(?:amp;)?)([^=&#]+)(?:=?([^&#]*))/g;
    let prefixPattern = /^([a-zA-Z0-9-]+:)http/;

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
            let result = this.getSet(value, "port");
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
            let current = this.getSet(undefined, "host");;
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

                let params: IMap<string[]> = {}
                let match: string[];

                while (match = paramPattern.exec(this.anchor.search)) {
                    // initialize with empty array if doesn't exist already
                    params[match[1]] = params[match[1]] || [];

                    params[match[1]].push(match[2]);
                }

                return params;
            }
            else {
                let search = "";
                for (let name in value) {
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
            
            let matches = url.match(prefixPattern);
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

        getHighlightMarkupPos(position: number, paramIndex: number = undefined): number[][] {
            let isCursorPositionAvailable = position != undefined;

            let fullUrl = this.url();
            let result: number[][] = [];

            let queryLength = this.anchor.search.length;
            let pathLength = this.anchor.pathname.length;
            let hostLenght = this.anchor.href.length - queryLength - pathLength - this.anchor.hash.length;

            if (isCursorPositionAvailable && position <= hostLenght) {
                // cursor somewhere in the beginning of the url / host part
                result.push([0, hostLenght]);
            }
            else if (isCursorPositionAvailable && position <= hostLenght + pathLength) {
                // cursor somewhere in the path
                result.push([hostLenght, hostLenght + pathLength]);
            }
            else if (!isCursorPositionAvailable || position <= hostLenght + pathLength + queryLength) {
                let currentIndex = 0;
                // cursor somewhere in query area
                fullUrl.replace(paramPattern, (match: string, paramName: string, paramValue: string, offset: number) => {
                    // Increment offset as the pattern conatin joiner char (? or &)
                    offset++;
                    // check if we should higlight this param
                    if ((!isCursorPositionAvailable && currentIndex == paramIndex) ||
                        (position >= offset && position <= offset + paramName.length + paramValue.length + 1)) {
                        result.push([offset, offset + paramName.length]);
                        result.push([offset + paramName.length + 1, offset + paramName.length + 1 + paramValue.length]);
                    }

                    currentIndex++;

                    return match;
                });
            }
            
            if (result.length == 0) {
                let hash = this.hash();
                if (hash && position > fullUrl.length - hash.length) {
                    result.push([fullUrl.length - hash.length, fullUrl.length]);
                }
            }

            return result;
        }
    }
}