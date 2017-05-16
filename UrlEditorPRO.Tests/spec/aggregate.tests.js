var Tests;
(function (Tests) {
    function all(description, callArguments, testFunction) {
        callArguments.forEach(function (args) {
            it(description + "; Case: " + JSON.stringify(args), function () {
                testFunction.apply(null, args);
            });
        });
    }
    Tests.all = all;
})(Tests || (Tests = {}));
// Seems to be the fastest way to replace all occurances of a string in a string
// http://jsperf.com/htmlencoderegex/25
String.prototype.replaceAll = function (searchValue, replaceValue, ignoreCase) {
    return this.replace(new RegExp(searchValue.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignoreCase ? "gi" : "g")), (typeof (replaceValue) == "string") ? replaceValue.replace(/\$/g, "$$$$") : replaceValue);
};
String.prototype.htmlEncode = function () {
    return this.replaceAll("&", "&amp;").replace("\"", "&quot;").replace("'", "&#39;").replace("<", "&lt;").replace(">", "&gt;");
};
var UrlEditor;
(function (UrlEditor) {
    var Helpers;
    (function (Helpers) {
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
        Helpers.getIndexOfSiblingGivenType = getIndexOfSiblingGivenType;
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
        Helpers.findNthElementOfType = findNthElementOfType;
        /**
         * Wrapper for document.getElementById
         */
        function ge(elementId) {
            return document.getElementById(elementId);
        }
        Helpers.ge = ge;
        /**
         * Encodes given string with Base64 algorythm
         */
        function b64EncodeUnicode(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) { return String.fromCharCode(parseInt("0x" + p1)); }));
        }
        Helpers.b64EncodeUnicode = b64EncodeUnicode;
        /**
         * Decodes string using Base64 algorythm
         */
        function b64DecodeUnicode(str) {
            return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join(''));
        }
        Helpers.b64DecodeUnicode = b64DecodeUnicode;
        /**
         * Checks if given string can be Base64 encoded
         */
        function isBase64Encoded(val) {
            // TODO whenever test passes we can try to decode and check if there are only valid string chars
            return base64Pattern.test(val);
        }
        Helpers.isBase64Encoded = isBase64Encoded;
        function isTextFieldActive() {
            return isTextField(document.activeElement);
        }
        Helpers.isTextFieldActive = isTextFieldActive;
        function isTextField(elem) {
            // check if tag is an INPUT or TEXTAREA, additionally check if the INPUT type is text
            return (elem.tagName == "INPUT" && elem.type == "text") ||
                (elem.tagName == "DIV" && elem.id == "full_url");
        }
        Helpers.isTextField = isTextField;
        /**
         * Encodes query parameters/components
         *
         * Should be used as a replacement for encodeURIComponent
         */
        function encodeQueryParameter(queryParam) {
            // encodeURIComponent doesn't correcly encode all characters required by RFC 3986
            // reference: http://stackoverflow.com/questions/18251399/why-doesnt-encodeuricomponent-encode-single-quotes-apostrophes
            // additionaly, for query parameters it's allowed to use + instead of to %20, which gives a nicer looking URL
            // %20 is only required when encoding in the path part of the URL, not the query part of the URL
            // reference: http://stackoverflow.com/questions/1634271/url-encoding-the-space-character-or-20
            return encodeURIComponent(queryParam).replace(/[!'()*]/g, escape).replace(/%20/g, "+");
        }
        Helpers.encodeQueryParameter = encodeQueryParameter;
        function ensureIsVisible(elem, container, containerHeight) {
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
        Helpers.ensureIsVisible = ensureIsVisible;
    })(Helpers = UrlEditor.Helpers || (UrlEditor.Helpers = {}));
})(UrlEditor || (UrlEditor = {}));
/// <reference path="helpers.ts" />
/// <reference path="shared_interfaces.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    var RichTextboxViewModel = (function () {
        function RichTextboxViewModel(doc) {
            var _this = this;
            this.doc = doc;
            var fullUrl = UrlEditor.Helpers.ge("full_url");
            this.richText = new RichTextBox(fullUrl);
            doc.body.addEventListener("input", function (evt) { return _this.onDomEvent(evt.target, evt.type); });
            doc.body.addEventListener("DOMFocusIn", function (evt) { return _this.onDomEvent(evt.target, evt.type); });
            // handle clicks and cursor position hanges in full url field
            fullUrl.addEventListener("selectstart", function (evt) { return _this.onDomEvent(evt.currentTarget, evt.type); });
        }
        RichTextboxViewModel.prototype.onDomEvent = function (elem, evtType) {
            var _this = this;
            if (UrlEditor.Helpers.isTextFieldActive()) {
                var action_1;
                var delay = false;
                switch (elem.id) {
                    case "full_url":
                        if (evtType == "DOMFocusIn") {
                            // we dont need to handle it
                            return;
                        }
                        var isEventTriggeredByClick_1 = evtType == "selectstart";
                        action_1 = function () {
                            var cursorPos = _this.richText.getCursorPos();
                            _this.highlight(cursorPos, undefined);
                            if (isEventTriggeredByClick_1) {
                                // bring back original cursor pos
                                _this.richText.setCursorPos(cursorPos);
                            }
                        };
                        // when the click event is rised the element doesn't have focus yet so we need to delay reading cursor position
                        delay = isEventTriggeredByClick_1;
                        break;
                    case "hostname":
                    case "path":
                        action_1 = function () { return _this.highlightHostOrPath(elem); };
                        // delay handling - we need to wait when all fields will be updated (by ViewModel)
                        delay = evtType == "input";
                        break;
                    default:
                        var paramContainer = this.doc.activeElement.parentElement;
                        if (paramContainer.isParamContainer) {
                            action_1 = function () { return _this.highlightParams(elem); };
                            // delay handling - we need to wait when all fields will be updated (by ViewModel)
                            delay = true;
                        }
                }
                if (action_1) {
                    if (delay) {
                        setTimeout(function () { return action_1(); }, 0);
                    }
                    else {
                        action_1();
                    }
                }
            }
        };
        RichTextboxViewModel.prototype.highlightHostOrPath = function (elem) {
            var cursorPos = 0;
            var uri = new UrlEditor.Uri(this.richText.getText());
            cursorPos += uri.protocol().length + uri.host().length + 2; // 2 - for double slash after protocol
            if (elem.id == "path") {
                cursorPos += uri.pathname().length;
            }
            this.highlight(cursorPos, undefined);
        };
        RichTextboxViewModel.prototype.highlightParams = function (elem) {
            var paramContainer = this.doc.activeElement.parentElement;
            if (paramContainer.isParamContainer) {
                var paramIndex = 0;
                // set param position/number
                while (paramContainer.previousElementSibling) {
                    paramContainer = paramContainer.previousElementSibling;
                    // increment only when previous sibling is a real param container
                    paramIndex += paramContainer.isParamContainer ? 1 : 0;
                }
                this.highlight(undefined, paramIndex);
            }
        };
        RichTextboxViewModel.prototype.highlight = function (pos, paramIndex) {
            var uri = new UrlEditor.Uri(this.richText.getText());
            var currentActiveElem = this.doc.activeElement;
            var markupPositions = uri.getHighlightMarkupPos(pos, paramIndex);
            this.richText.highlight(markupPositions);
        };
        return RichTextboxViewModel;
    }());
    UrlEditor.RichTextboxViewModel = RichTextboxViewModel;
    var RichTextBox = (function () {
        function RichTextBox(elem) {
            if (typeof elem == "string") {
                this.elem = UrlEditor.Helpers.ge(elem);
            }
            else {
                this.elem = elem;
            }
            this.doc = this.elem.ownerDocument;
            this.window = this.doc.defaultView;
        }
        RichTextBox.prototype.highlight = function (markupPos) {
            var originalText = this.elem.textContent;
            var result = "";
            var lastPos = 0;
            markupPos.forEach(function (elemPos) {
                result += originalText.substr(lastPos, elemPos[0] - lastPos).htmlEncode() + "<b>" + originalText.substr(elemPos[0], elemPos[1] - elemPos[0]).htmlEncode() + "</b>";
                lastPos = elemPos[1];
            });
            result += originalText.substr(lastPos, originalText.length - lastPos).htmlEncode();
            // avoid updating DOM when it is not necessarry
            if (this.elem.innerHTML != result) {
                this.elem.innerHTML = result;
            }
        };
        RichTextBox.prototype.getCursorPos = function (selectionEnd) {
            if (selectionEnd === void 0) { selectionEnd = false; }
            var pos = 0;
            var sel = this.window.getSelection();
            if (sel.rangeCount > 0) {
                var range = sel.getRangeAt(0);
                var preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(this.elem);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                pos = preCaretRange.toString().length;
                if (selectionEnd) {
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                    pos = preCaretRange.toString().length;
                }
            }
            return pos;
        };
        RichTextBox.prototype.setCursorPos = function (pos) {
            this.select(pos, pos);
        };
        RichTextBox.prototype.select = function (start, end) {
            if (start > end) {
                // gacefully fail
                return;
            }
            var range = this.doc.createRange();
            var startNode, endNode;
            // iterate over all nodes: text, element, etc
            for (var i = 0; i < this.elem.childNodes.length; i++) {
                var node = this.elem.childNodes[i];
                var currentNodeTextLength = node.textContent.length;
                if (start < currentNodeTextLength || end <= currentNodeTextLength) {
                    // if it is not text node we need to get the one inside
                    if (node.nodeType != Node.TEXT_NODE) {
                        node = node.childNodes[0];
                    }
                    if (!startNode) {
                        startNode = node;
                    }
                    if (end <= currentNodeTextLength) {
                        endNode = node;
                        break;
                    }
                }
                // change start value only if node hasn't been found yet
                start -= startNode ? 0 : currentNodeTextLength;
                end -= currentNodeTextLength;
            }
            if (startNode && endNode) {
                var sel = this.window.getSelection();
                // set same pos for start and end
                range.setStart(startNode, start);
                range.setEnd(endNode, end);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        };
        RichTextBox.prototype.focus = function () {
            this.elem.focus();
        };
        RichTextBox.prototype.getText = function () {
            return this.elem.textContent;
        };
        RichTextBox.prototype.removeFormatting = function () {
            // remove all html markup from element content
            this.elem.textContent = this.elem.textContent;
        };
        return RichTextBox;
    }());
    UrlEditor.RichTextBox = RichTextBox;
})(UrlEditor || (UrlEditor = {}));
/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../helpers/helpers.ts" />
/// <reference path="../../../urleditorpro/app/modules/rich_textbox.ts" />
var Tests;
(function (Tests) {
    describe("Rich textbox test validating if", function () {
        var rtb;
        var elem;
        beforeEach(function () {
            elem = document.createElement("div");
            elem.textContent = "http://something.com/path?param1=value1";
            rtb = new UrlEditor.RichTextBox(elem);
        });
        it("RichTextBox highlights sigle part of the element text", function () {
            rtb.highlight([[7, 20]]);
            expect(elem.innerHTML).toEqual("http://<b>something.com</b>/path?param1=value1");
        });
        it("RichTextBox highlights multiple parts of the element text", function () {
            rtb.highlight([[7, 20], [26, 32]]);
            expect(elem.innerHTML).toEqual("http://<b>something.com</b>/path?<b>param1</b>=value1");
        });
        it("RichTextBox highlight clears previous highlight", function () {
            elem.innerHTML = "http://<b>something.com</b>/path?param1=value1";
            rtb.highlight([[33, 39]]);
            expect(elem.innerHTML).toEqual("http://something.com/path?param1=<b>value1</b>");
        });
        it("RichTextBox highlight encodes properly highlighted text", function () {
            elem.textContent = "http://something.com/path?param1=value1<>&param2=<>'\")(*&^%$#@&param3=<>";
            rtb.highlight([[49, 63]]);
            expect(elem.innerHTML).toEqual("http://something.com/path?param1=value1&lt;&gt;&amp;param2=<b>&lt;&gt;'\")(*&amp;^%$#@&amp;</b>param3=&lt;&gt;");
        });
    });
})(Tests || (Tests = {}));
/// <reference path="shared_interfaces.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    var paramPattern = /([^\?=&#]+)=([^\?&#]*)/g; // consider to change it to /(?:\?|&(?:amp;)?)([^=&#]+)(?:=?([^&#]*))/g
    var prefixPattern = /^([a-zA-Z0-9-]+:)http/;
    var Uri = (function () {
        function Uri(uri) {
            this.urlPrefix = ""; // like view-source:
            this.anchor = document.createElement('a');
            this.url(uri);
        }
        Uri.prototype.getSet = function (value, propertyName) {
            // check whether to set or return a value
            if (value == undefined) {
                return this.anchor[propertyName];
            }
            this.anchor[propertyName] = value;
        };
        Uri.prototype.protocol = function (value) {
            return this.getSet(value, "protocol");
        };
        Uri.prototype.hostname = function (value) {
            return this.getSet(value, "hostname");
        };
        Uri.prototype.port = function (value) {
            var result = this.getSet(value, "port");
            return result ? parseInt(result) : undefined;
        };
        Uri.prototype.pathname = function (value) {
            return this.getSet(value, "pathname");
        };
        Uri.prototype.query = function (value) {
            return this.getSet(value, "search");
        };
        Uri.prototype.hash = function (value) {
            return this.getSet(value, "hash");
        };
        Uri.prototype.host = function (value) {
            var current = this.getSet(undefined, "host");
            ;
            if (value == undefined) {
                return current;
            }
            // sometimes port number stays in the url - we need to be sure that it won't be in the final url when it is not needed
            if (this.getSet(undefined, "port") == "0" && value.indexOf(":") == -1) {
                value += ":80"; // set default http port number (it will disappear on final url)
            }
            return this.getSet(value, "host");
        };
        Uri.prototype.params = function (value) {
            // check whether we should set or return value
            if (value == undefined) {
                var params = {};
                var match;
                while (match = paramPattern.exec(this.anchor.search)) {
                    // initialize with empty array if doesn't exist already
                    params[match[1]] = params[match[1]] || [];
                    params[match[1]].push(match[2]);
                }
                return params;
            }
            else {
                var search = "";
                for (var name in value) {
                    if (value[name].length == 0) {
                        // add empty string as a value otherwise param won't be added
                        value[name].push("");
                    }
                    value[name].forEach(function (val) {
                        search += search ? "&" : "";
                        search += name + "=" + val;
                    });
                }
                if (search) {
                    search = "?" + search;
                }
                this.anchor.search = search;
            }
        };
        Uri.prototype.url = function (url) {
            if (url == undefined) {
                // return regular url with prefix (like 'view-source:')
                return this.urlPrefix + this.anchor.href;
            }
            var matches = url.match(prefixPattern);
            if (matches && matches.length > 1) {
                this.urlPrefix = matches[1];
                // remove prefix from the url before passing it to anchor elem
                url = url.replace(prefixPattern, "http");
            }
            else {
                this.urlPrefix = "";
            }
            this.anchor.href = url;
        };
        Uri.prototype.getHighlightMarkupPos = function (position, paramIndex) {
            if (paramIndex === void 0) { paramIndex = undefined; }
            var isCursorPositionAvailable = position != undefined;
            var fullUrl = this.url();
            var result = [];
            var queryLength = this.anchor.search.length;
            var pathLength = this.anchor.pathname.length;
            var hostLenght = this.anchor.href.length - queryLength - pathLength - this.anchor.hash.length;
            if (isCursorPositionAvailable && position <= hostLenght) {
                // cursor somewhere in the beginning of the url / host part
                result.push([0, hostLenght]);
            }
            else if (isCursorPositionAvailable && position <= hostLenght + pathLength) {
                // cursor somewhere in the path
                result.push([hostLenght, hostLenght + pathLength]);
            }
            else if (!isCursorPositionAvailable || position <= hostLenght + pathLength + queryLength) {
                var currentIndex = 0;
                // cursor somewhere in query area
                fullUrl.replace(paramPattern, function (match, paramName, paramValue, offset) {
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
                var hash = this.hash();
                if (hash && position > fullUrl.length - hash.length) {
                    result.push([fullUrl.length - hash.length, fullUrl.length]);
                }
            }
            return result;
        };
        return Uri;
    }());
    UrlEditor.Uri = Uri;
})(UrlEditor || (UrlEditor = {}));
/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../helpers/helpers.ts" />
/// <reference path="../../../UrlEditorPro/app/modules/url_parser.ts" />
var Tests;
(function (Tests) {
    describe("Uri class", function () {
        it("parses simple url", function () {
            var uri = new UrlEditor.Uri("http://somedomain.com:85/search?param=1&test=zonk#page_section");
            expect(uri.protocol()).toEqual("http:");
            expect(uri.host()).toEqual("somedomain.com:85");
            expect(uri.hostname()).toEqual("somedomain.com");
            expect(uri.pathname()).toEqual("/search");
            expect(uri.query()).toEqual("?param=1&test=zonk");
            expect(uri.hash()).toEqual("#page_section");
            expect(uri.params()["param"]).toEqual(["1"]);
        });
        it("parses url witch contains params with empty values", function () {
            var uri = new UrlEditor.Uri("http://somedomain.com/?param_empty1=&param=test1&param_empty2=");
            expect(uri.params()["param_empty1"]).toEqual([""]);
            expect(uri.params()["param_empty2"]).toEqual([""]);
        });
        it("parses url witch contains params with same names", function () {
            var uri = new UrlEditor.Uri("http://somedomain.com/?param=test1&param=test2&someother_param=test");
            expect(uri.params()["param"]).toEqual(["test1", "test2"]);
            expect(uri.params()["someother_param"]).toEqual(["test"]);
        });
        it("sets url with params with same names", function () {
            var uri = new UrlEditor.Uri("http://something/?d=1&d=2");
            var newParams = {
                "d": ["3", "4"]
            };
            uri.params(newParams);
            expect(uri.params()).toEqual(newParams);
            expect(uri.url()).toEqual("http://something/?d=3&d=4");
        });
        Tests.all("gets hit-highlighted param when calling getHighlightedUrl with cursor position", [
            // host
            ["|http://something/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
            ["htt|p://something/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
            ["http:/|/something/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
            ["http://something|/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
            ["http://somethin|g/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
            // path
            ["http://something/|dddd/r?param1=1&param2=val2&param3=t", [[16, 23]]],
            ["http://something/dddd|/r?param1=1&param2=val2&param3=t", [[16, 23]]],
            ["http://something/dddd/r|?param1=1&param2=val2&param3=t", [[16, 23]]],
            ["http://192.168.2.104:8080/m|#/Floorplans", [[25, 27]]],
            // params
            ["http://something/dddd?param1=1&param|2=val2&param3=t", [[31, 37], [38, 42]]],
            ["http://something/dddd?param1=1&param2=|val2&param3=t", [[31, 37], [38, 42]]],
            ["http://something/dddd?param1=1&param2=val2|&param3=t", [[31, 37], [38, 42]]],
            ["http://something/dddd?param1=1&|param2=val2&param3=t", [[31, 37], [38, 42]]],
            ["http://something/dddd?param1=1&param2=val2&param3=t|", [[43, 49], [50, 51]]],
            ["http://something/dddd?|param1=1&param2=val2&param3=t", [[22, 28], [29, 30]]],
            // with hash
            ["http://something/dddd?param1=1&param2=val2&param3=t|#something&", [[43, 49], [50, 51]]],
            ["http://something/dddd?param1=1&param2=val2&param3=t#|something&", [[51, 62]]],
            ["http://something/dddd?param1=1&param2=val2&param3=t#something&|", [[51, 62]]],
        ], function (url, expected) {
            var uri = new UrlEditor.Uri(url.replace("|", ""));
            var result = uri.getHighlightMarkupPos(url.indexOf("|"));
            expect(result).toEqual(expected);
        });
        Tests.all("gets hit-highlighted param when calling getHighlightedUrl with param index position", [
            ["http://something/dddd?param1=1&param2=val2&param3=t", 0, [[22, 28], [29, 30]]],
            ["http://something/dddd?param1=1&param2=val2&param3=t", 1, [[31, 37], [38, 42]]],
            ["http://something/dddd?param1=1&param2=val2&param3=t", 2, [[43, 49], [50, 51]]],
        ], function (url, pos, expected) {
            var uri = new UrlEditor.Uri(url.replace("|", ""));
            var result = uri.getHighlightMarkupPos(undefined, pos);
            expect(result).toEqual(expected);
        });
    });
})(Tests || (Tests = {}));
