var UrlEditor;
(function (UrlEditor) {
    var base64Pattern = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
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
    /**
     * Wrapper for document.getElementById
     */
    function ge(elementId) {
        return document.getElementById(elementId);
    }
    UrlEditor.ge = ge;
    /**
     * Encodes given string with Base64 algorythm
     */
    function b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) { return String.fromCharCode(parseInt("0x" + p1)); }));
    }
    UrlEditor.b64EncodeUnicode = b64EncodeUnicode;
    /**
     * Decodes string using Base64 algorythm
     */
    function b64DecodeUnicode(str) {
        return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join(''));
    }
    UrlEditor.b64DecodeUnicode = b64DecodeUnicode;
    /**
     * Checks if given string can be Base64 encoded
     */
    function isBase64Encoded(val) {
        return base64Pattern.test(val);
    }
    UrlEditor.isBase64Encoded = isBase64Encoded;
})(UrlEditor || (UrlEditor = {}));
