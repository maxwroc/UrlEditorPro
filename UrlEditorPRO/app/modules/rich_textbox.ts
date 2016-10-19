﻿module UrlEditor {
    
    export class RichTextboxViewModel {

        private richText: RichTextBox;

        constructor(private doc: Document) {
            let paramsContainer = <HTMLDivElement>Helpers.ge("params");
            //paramsContainer.addEventListener("DOMFocusOut", evt => this.onDomEvent(<HTMLElement>evt.target));
            paramsContainer.addEventListener("click", evt => this.onDomEvent(<HTMLElement>evt.target));

            let fullUrl = <HTMLDivElement>Helpers.ge("full_url");
            this.richText = new RichTextBox(fullUrl);

            fullUrl.addEventListener("selectstart", (evt) => {
                setTimeout(() => {
                    let cursorPos = this.richText.getCursorPos();
                    this.highlight(cursorPos, true/*isCursorPos*/);
                }, 0);
            });
        }

        private onDomEvent(elem: HTMLElement) {
            if (Helpers.isTextFieldActive()) {
                let paramContainer = <IParamContainerElement>this.doc.activeElement.parentElement;
                if (paramContainer.isParamContainer) {
                    let paramIndex = 0;
                    // set param position/number
                    while (paramContainer.previousElementSibling) {
                        paramContainer = <IParamContainerElement>paramContainer.previousElementSibling;
                        // increment only when previous sibling is a real param container
                        paramIndex += paramContainer.isParamContainer ? 1 : 0;
                    }

                    this.highlight(paramIndex, false/*isCursorPos*/);
                }
            }
        }

        private highlight(pos: number, isCursorPos: boolean) {

            let uri = new Uri(this.richText.getText());
            let currentActiveElem = <HTMLElement>this.doc.activeElement;

            // remove previous markup
            // this.richText.removeFormatting();

            let markupPositions = uri.getHighlightMarkupPos(pos, isCursorPos);
            this.richText.highlight(markupPositions);

            if (isCursorPos) {
                // bring back original cursor pos
                //this.richText.setCursorPos(pos);
            }
            
            // bring back the focus to original elem
            //currentActiveElem.focus();
            //UrlEditor.Helpers.ge("params").firstChild.firstChild["nextElementSibling"].focus();
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
            var originalText = this.elem.textContent;
            var result = "";
            let lastPos = 0;
            markupPos.forEach((elemPos) => {
                result += originalText.substr(lastPos, elemPos[0] - lastPos) + "<b>" + originalText.substr(elemPos[0], elemPos[1] - elemPos[0]) + "</b>";
                lastPos = elemPos[1];
            });

            result += originalText.substr(lastPos, originalText.length - lastPos);

            this.elem.innerHTML = result;
        }

        getCursorPos(selectionEnd = false): number {
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
        }

        setCursorPos(pos: number) {
            this.select(pos, pos);
        }

        select(start, end) {
            if (start > end) {
                // gacefully fail
                return;
            }
            
            var range = this.doc.createRange();
            var startNode: Node, endNode: Node;

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
                var sel = this.window.getSelection();

                // set same pos for start and end
                range.setStart(startNode, start);
                range.setEnd(endNode, end);

                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

        focus(): void {
            this.elem.focus;
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