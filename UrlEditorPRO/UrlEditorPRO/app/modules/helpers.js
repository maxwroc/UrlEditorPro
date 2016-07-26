var UrlEditor;
(function (UrlEditor) {
    /**
     * It iterates over previous siblings and counts elements of given tag names (types)
     */
    function getIndexOfSiblingGivenType(elem, types) {
        var index = 0;
        for (var i = 0; elem = elem.previousElementSibling;) {
            if (types.indexOf(elem.tagName) != -1) {
                index++;
            }
        }
        return index;
    }
    UrlEditor.getIndexOfSiblingGivenType = getIndexOfSiblingGivenType;
    /**
     * Returns element in the same column as the given one (grid layout)
     */
    function findNthElementOfType(container, types, index) {
        var elementsFound = 0;
        var lastFound = null;
        for (var i = 0, child; child = container.children[i++];) {
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
    UrlEditor.findNthElementOfType = findNthElementOfType;
})(UrlEditor || (UrlEditor = {}));
