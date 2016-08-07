
module UrlEditor {
    
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
}