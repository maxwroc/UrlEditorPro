module UrlEditor.ParamOptions {
    let clickAction = "clickAction";

    let doc: Document;
    let menuElem: IParamOptionsContainer;
    let paramContainer: IParamContainerElement;
    let deleteParam: (paramContainer: IParamContainerElement) => void;
    let encodeDecodeParam: (paramContainer: IParamContainerElement, base64: boolean) => void;

    export function init(
        _doc: Document,
        deleteParamAction: (paramContainer: IParamContainerElement) => void,
        encodeDecodeParamAction: (paramContainer: IParamContainerElement, base64: boolean) => void) {
        doc = _doc;
        deleteParam = deleteParamAction;
        encodeDecodeParam = encodeDecodeParamAction;
    }

    export function show(paramContainerElem: IParamContainerElement, pressedButton: HTMLElement) {


        // update local variable required by event handline
        paramContainer = paramContainerElem;

        if (!menuElem) {
            initializeContainer();
        }

        menuElem.urlEncodeElem.checked = paramContainer.urlEncoded;
        menuElem.base64EncodeElem.checked = paramContainer.base64Encoded;

        menuElem.style.display = "block";
    }

    export function hide() {
        if (menuElem) {
            menuElem.style.display = "none";
        }
    }

    function initializeContainer() {
        // for some reason TS compiler doesn't like such cast in case of UL elements
        menuElem = doc.createElement("ul");
        menuElem.setAttribute("id", "paramMenu");

        menuElem.addEventListener("click", evt => {
            evt.stopPropagation();

            let elem = <HTMLElement>evt.target;
            elem[clickAction] && elem[clickAction]();

            hide();
        }, true);

        let inputs = menuElem.getElementsByTagName("input");
        for (let i = 0, input: HTMLInputElement; input = <HTMLInputElement>inputs[i]; i++) {
            switch (input.name) {
                case "param_urlEncode":
                    input["clickAction"] = () => encodeDecodeParam(paramContainer, false/*base64*/);
                    menuElem.urlEncodeElem = input;
                    break;
                case "param_base64Encode":
                    input["clickAction"] = () => encodeDecodeParam(paramContainer, true/*base64*/);
                    menuElem.base64EncodeElem = input;
                    break;
                case "param_delete":
                    input["clickAction"] = () => deleteParam(paramContainer);
                    break;
            }
        }

        
        doc.body.appendChild(menuElem);
    }

    interface IParamOptionsContainer extends HTMLUListElement {
        urlEncodeElem?: HTMLInputElement;
        base64EncodeElem?: HTMLInputElement;
    }
}