/// <reference path="helpers.ts" />
/// <reference path="shared_interfaces.d.ts" />

module UrlEditor {
    
    export class RichTextboxViewModel {

        private richText: RichTextBox;

        constructor(private doc: Document) {

            let fullUrl = <HTMLDivElement>Helpers.ge("full_url");
            this.richText = new RichTextBox(fullUrl);

            doc.body.addEventListener("input", evt => this.onDomEvent(<HTMLElement>evt.target, evt.type));
            doc.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(<HTMLElement>evt.target, evt.type));
            
            // handle clicks and cursor position hanges in full url field
            fullUrl.addEventListener("selectstart", (evt) => this.onDomEvent(<HTMLElement>evt.currentTarget, evt.type));
        }

        private onDomEvent(elem: HTMLElement, evtType: string) {
            if (Helpers.isTextFieldActive()) {
                let action: Function;
                let delay = false;

                switch (elem.id) {
                    case "full_url":
                        if (evtType == "DOMFocusIn") {
                            // we dont need to handle it
                            return;
                        }

                        let isEventTriggeredByClick = evtType == "selectstart";
                        action = () => {
                            let cursorPos = this.richText.getCursorPos();
                            this.highlight(cursorPos, undefined);

                            if (isEventTriggeredByClick) {
                                // bring back original cursor pos
                                this.richText.setCursorPos(cursorPos);
                            }
                        }
                        // when the click event is rised the element doesn't have focus yet so we need to delay reading cursor position
                        delay = isEventTriggeredByClick;
                        break;
                    case "hostname":
                    case "path":
                        action = () => this.highlightHostOrPath(elem);
                        // delay handling - we need to wait when all fields will be updated (by ViewModel)
                        delay = evtType == "input";
                        break;
                    default:
                        let paramContainer = <IParamContainerElement>elem.parentElement;
                        if (paramContainer.isParamContainer) {
                            action = () => this.highlightParams(elem);
                            // delay handling - we need to wait when all fields will be updated (by ViewModel)
                            delay = true;
                        }
                }

                if (action) {
                    if (delay) {
                        setTimeout(() => action(), 0);
                    }
                    else {
                        action();
                    }
                }
            }
        }

        private highlightHostOrPath(elem: HTMLElement) {
            let cursorPos = 0;
            
            let uri = new Uri(this.richText.getText());
            cursorPos += uri.protocol().length + uri.host().length + 2; // 2 - for double slash after protocol

            if (elem.id == "path") {
                cursorPos += uri.pathname().length;
            }
            
            this.highlight(cursorPos, undefined);
        }

        private highlightParams(elem: HTMLElement) {
            let paramContainer = <IParamContainerElement>elem.parentElement;
            if (paramContainer.isParamContainer) {
                let paramIndex = 0;
                // set param position/number
                while (paramContainer.previousElementSibling) {
                    paramContainer = <IParamContainerElement>paramContainer.previousElementSibling;
                    // increment only when previous sibling is a real param container
                    paramIndex += paramContainer.isParamContainer ? 1 : 0;
                }

                this.highlight(undefined, paramIndex);
            }
        }

        private highlight(pos: number, paramIndex: number) {

            let uri = new Uri(this.richText.getText());
            let currentActiveElem = <HTMLElement>this.doc.activeElement;

            let markupPositions = uri.getHighlightMarkupPos(pos, paramIndex);
            this.richText.highlight(markupPositions);
        }
    }

    export class RichTextBox {

        private elem: HTMLElement;
        private doc: Document;
        private window: Window;

        constructor(elem: string | HTMLElement) {
            if (typeof elem == "string") {
                this.elem = Helpers.ge(<string>elem);
            }
            else {
                this.elem = <HTMLElement>elem;
            }
            
            this.doc = this.elem.ownerDocument;
            this.window = this.doc.defaultView;
        }

        highlight(markupPos: number[][]) {
            let originalText = this.elem.textContent;
            let result = "";
            let lastPos = 0;
            markupPos.forEach((elemPos) => {
                result += originalText.substr(lastPos, elemPos[0] - lastPos).htmlEncode() + "<b>" + originalText.substr(elemPos[0], elemPos[1] - elemPos[0]).htmlEncode() + "</b>";
                lastPos = elemPos[1];
            });

            result += originalText.substr(lastPos, originalText.length - lastPos).htmlEncode();

            // avoid updating DOM when it is not necessarry
            if (this.elem.innerHTML != result) {
                this.elem.innerHTML = result;
            }
        }

        getCursorPos(selectionEnd = false): number {
            let pos = 0;
            let sel = this.window.getSelection();

            if (sel.rangeCount > 0) {
                let range = sel.getRangeAt(0);
                let preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(this.elem);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                pos = preCaretRange.toString().length;

                if (selectionEnd) {
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                    pos = preCaretRange.toString().length;
                }
            }

            return pos;
        }

        setCursorPos(pos: number) {
            this.select(pos, pos);
        }

        select(start, end) {
            if (start > end) {
                // gacefully fail
                return;
            }
            
            let range = this.doc.createRange();
            let startNode: Node, endNode: Node;

            // iterate over all nodes: text, element, etc
            for (let i = 0; i < this.elem.childNodes.length; i++) {
                let node = this.elem.childNodes[i];
                let currentNodeTextLength = node.textContent.length;

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
                let sel = this.window.getSelection();

                // set same pos for start and end
                range.setStart(startNode, start);
                range.setEnd(endNode, end);

                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

        focus(): void {
            this.elem.focus();
        }

        getText(): string {
            return this.elem.textContent;
        }

        removeFormatting() {
            // remove all html markup from element content
            this.elem.textContent = this.elem.textContent;
        }
    }
}