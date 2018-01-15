// use of deprecated function
declare function escape(s: string): string;

interface String {
    replaceAll(searchValue: string, replaceValue, ignoreCase?: boolean): string;
    htmlEncode(): string;
}
// Seems to be the fastest way to replace all occurances of a string in a string
// http://jsperf.com/htmlencoderegex/25
String.prototype.replaceAll = function (searchValue, replaceValue, ignoreCase) {
    return this.replace(new RegExp(searchValue.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignoreCase ? "gi" : "g")), (typeof (replaceValue) == "string") ? replaceValue.replace(/\$/g, "$$$$") : replaceValue);
};
String.prototype.htmlEncode = function () {
    return this.replaceAll("&", "&amp;").replace("\"", "&quot;").replace("'", "&#39;").replace("<", "&lt;").replace(">", "&gt;");
};


module UrlEditor {
    export const enum OpenIn {
        CurrentTab,
        NewTab,
        NewWindow
    }

    export class Command {
        public static GoToHomepage = "GoToHomepage";
        public static RedirectUseFirstRule = "RedirectUseFirstRule";
        public static ReloadRedirectionRules = "ReloadRedirectionRules";
    }
}

module UrlEditor.Helpers {

    var base64Pattern = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;

    /**
     * It iterates over previous siblings and counts elements of given tag names (types)
     */
    export function getIndexOfSiblingGivenType(elem: HTMLElement, types: string[]): number {
        var index = 0;
        for (var i = 0; elem = <HTMLElement>elem.previousElementSibling;) {
            if (types.indexOf(elem.tagName) != -1) {
                index++;
            }
        }

        return index;
    }

    /**
     * Returns element in the same column as the given one (grid layout)
     */
    export function findNthElementOfType(container: HTMLElement, types: string[], index: number): HTMLElement {
        var elementsFound = 0;
        var lastFound = null;
        for (var i = 0, child: HTMLElement; child = <HTMLElement>container.children[i++];) {
            if (types.indexOf(child.tagName) != -1) {
                if (elementsFound == index) {
                    return child;
                }

                lastFound = child;

                elementsFound++;
            }
        }

        return lastFound;
    }

    /**
     * Wrapper for document.getElementById
     */
    export function ge<T extends HTMLElement>(elementId: string): T {
        return <T>document.getElementById(elementId);
    }

    /**
     * Encodes given string with Base64 algorythm
     */
    export function b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt("0x" + p1))));
    }

    /**
     * Decodes string using Base64 algorythm
     */
    export function b64DecodeUnicode(str) {
        return decodeURIComponent(Array.prototype.map.call(atob(str), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    }

    /**
     * Checks if given string can be Base64 encoded
     */
    export function isBase64Encoded(val: string) {
        // TODO whenever test passes we can try to decode and check if there are only valid string chars
        return base64Pattern.test(val);
    }



    export function isTextFieldActive(): boolean {
        return isTextField(document.activeElement);
    }

    export function isTextField(elem: Element): boolean {
        // check if tag is an INPUT or TEXTAREA, additionally check if the INPUT type is text
        return (elem.tagName == "INPUT" && (<HTMLInputElement>elem).type == "text") ||
            (elem.tagName == "DIV" && elem.id == "full_url");
    }

    /**
     * Encodes query parameters/components
     *
     * Should be used as a replacement for encodeURIComponent
     */
    export function encodeQueryParameter(queryParam: string): string {
        // encodeURIComponent doesn't correcly encode all characters required by RFC 3986
        // reference: http://stackoverflow.com/questions/18251399/why-doesnt-encodeuricomponent-encode-single-quotes-apostrophes
        // additionaly, for query parameters it's allowed to use + instead of to %20, which gives a nicer looking URL
        // %20 is only required when encoding in the path part of the URL, not the query part of the URL
        // reference: http://stackoverflow.com/questions/1634271/url-encoding-the-space-character-or-20
        return encodeURIComponent(queryParam).replace(/[!'()*]/g, escape).replace(/%20/g, "+");
    }

    export function ensureIsVisible(elem: HTMLElement, container: HTMLElement, containerHeight: number) {
        var containerScrollTop = container.scrollTop;
        var suggestionElemOffsetTop = elem.offsetTop;
        var offsetBottom = suggestionElemOffsetTop + elem.offsetHeight;
        if (offsetBottom > containerScrollTop + containerHeight) {
            container.scrollTop = offsetBottom - containerHeight;
        }
        else if (suggestionElemOffsetTop < containerScrollTop) {
            container.scrollTop = suggestionElemOffsetTop;
        }
    }

    export const safeExecute = lazyInit(safeExecuteInitializer);

    function safeExecuteInitializer() {
        let logElem = ge("log");
        return (delegate: Function, description?: string) => {
            try {
                return delegate();
            }
            catch (e) {
                let msg = `[${description || "error"}] ${e.message}`;
                logElem && (logElem.textContent += "\n" + msg);
                console.warn(msg);
            }
        }
    }

    function lazyInit<T extends Function>(func: () => T): T {
        let initializedFunc: T;
        return (<any>((...args: any[]) => {
            if (!initializedFunc) {
                initializedFunc = func();
            }

            return initializedFunc.apply(this, args);
        })) as T
    }
}