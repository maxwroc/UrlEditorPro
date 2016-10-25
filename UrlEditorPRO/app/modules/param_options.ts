module UrlEditor.ParamOptions {
    let doc: Document;
    let menuElem: HTMLUListElement;

    export function init(_doc: Document) {
        doc = _doc;
    }

    export function show(paramContainer: IParamContainerElement, pressedButton: HTMLElement) {
        if (!menuElem) {
            initializeContainer();
        }

        menuElem.innerHTML = `
                    <li>
                        <label for="url_encode"><input type="checkbox" name="param_urlEncode" ${paramContainer.urlEncoded ? "checked" : ""}/>Url encode</label>
                    </li>
                    <li>
                        <label><input type="checkbox" name="param_base64Encode" ${paramContainer.base64Encoded ? "checked" : ""}/>Base64 encode</label>
                    </li>
                    <li>
                        <input type="button" value="Delete" name="param_delete" />
                    </li>
                `;
    }

    function initializeContainer() {
        menuElem = doc.createElement("ul");
        menuElem.setAttribute("id", "paramMenu");

        menuElem.addEventListener("click", evt => {
        }, true);
        
        doc.body.appendChild(menuElem);
    }
}