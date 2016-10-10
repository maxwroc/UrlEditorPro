module UrlEditor {
    
    export class RichTextboxViewModel {

        private richText: RichTextBox;

        constructor(private doc: Document) {
            //doc.body.addEventListener("DOMFocusOut", evt => this.onDomEvent(<HTMLElement>evt.target));
            //doc.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(<HTMLElement>evt.target));

            let fullUrl = <HTMLDivElement>Helpers.ge("full_url");
            this.richText = new RichTextBox(fullUrl);

            fullUrl.addEventListener("selectstart", (evt) => {
                setTimeout(() => this.highlight(), 0);
            });
        }

        private onDomEvent(elem: HTMLElement) {
            if (Helpers.isTextFieldActive()) {
                if ((<IParamContainerElement>this.doc.activeElement.parentElement).isParamContainer) {
                    
                }
            }
        }

        private highlight() {
            let uri = new Uri(this.richText.getText());
            let pos = this.richText.getCursorPos();

            let markupPositions = uri.getHighlightMarkupPos(pos);
            markupPositions.forEach(pos => this.richText.highlight(pos[0], pos[1]));

            // bring back original cursor pos
            this.richText.setCursorPos(pos);

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

        highlight(start: number, end: number) {
            this.select(start, end);
            this.doc.execCommand("foreColor", false, "red");
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

                start -= currentNodeTextLength;
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
    }
}