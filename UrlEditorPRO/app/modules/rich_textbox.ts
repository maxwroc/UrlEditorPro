module UrlEditor {

    function getSelectionCharacterOffsetWithin(element) {
        var start = 0;
        var end = 0;
        var doc = element.ownerDocument || element.document;
        var win = doc.defaultView || doc.parentWindow;
        var sel;
        if (typeof win.getSelection != "undefined") {
            sel = win.getSelection();
            if (sel.rangeCount > 0) {
                var range = win.getSelection().getRangeAt(0);
                var preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                start = preCaretRange.toString().length;
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                end = preCaretRange.toString().length;
            }
        } else if ((sel = doc.selection) && sel.type != "Control") {
            var textRange = sel.createRange();
            var preCaretTextRange = doc.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToStart", textRange);
            end = preCaretTextRange.text.length;
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            end = preCaretTextRange.text.length;
        }
        return { start: start, end: end };
    }

    function setCursorPos(el, pos) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.setStart(el.childNodes[0], pos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    export class RichTextbox {

        private fullUrl: HTMLDivElement;

        constructor(private doc: Document) {
            doc.body.addEventListener("DOMFocusOut", evt => this.onDomEvent(<HTMLElement>evt.target));
            doc.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(<HTMLElement>evt.target));

            this.fullUrl = <HTMLDivElement>Helpers.ge("full_url");
            this.fullUrl.addEventListener("selectstart", (evt) => {
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
            var uri = new Uri(this.fullUrl.textContent);
            var pos = getSelectionCharacterOffsetWithin(this.fullUrl).start;
            this.fullUrl.innerHTML = uri.getHighlightedUrl(pos).replace("&", "&amp;")
            setCursorPos(this.fullUrl, pos);
        }
    }
}