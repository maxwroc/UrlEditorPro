module UrlEditor {
    export class RichTextbox {
        
        constructor(private doc: Document) {
            doc.body.addEventListener("DOMFocusOut", evt => this.onDomEvent(<HTMLElement>evt.target));
            doc.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(<HTMLElement>evt.target));
        }

        private onDomEvent(elem: HTMLElement) {
            if (Helpers.isTextFieldActive()) {
                if ((<IParamContainerElement>this.doc.activeElement.parentElement).isParamContainer) {
                    var fullUrl = <HTMLDivElement>Helpers.ge("full_url");
                    var uri = new Uri(fullUrl.textContent);
                    fullUrl.innerHTML = uri.getHighlightedUrl(Math.random() * fullUrl.textContent.length).replace("&", "&amp;");
                }
            }
        }
    }
}