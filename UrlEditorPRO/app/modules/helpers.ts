// use of deprecated function
declare function escape(s: string): string;

module UrlEditor {

    export const enum OpenIn {
        CurrentTab,
        NewTab,
        NewWindow
    }

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
    export function ge(elementId: string): HTMLElement {
        return document.getElementById(elementId);
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
        return base64Pattern.test(val);
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
}