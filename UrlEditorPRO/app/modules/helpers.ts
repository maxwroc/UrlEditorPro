
module UrlEditor {

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

    export function ge(elementId: string): HTMLElement {
        return document.getElementById(elementId);
    }

    export function b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt("0x" + p1))));
    }

    export function b64DecodeUnicode(str) {
        return decodeURIComponent(Array.prototype.map.call(atob(str), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    }

    export function isBase64Encoded(val: string) {
        return base64Pattern.test(val);
    }
}