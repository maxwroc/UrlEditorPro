﻿module UrlEditor.ParamOptions {
    let clickAction = "clickAction";

    let doc: Document;
    let menuElem: IParamOptionsContainer;
    let paramContainer: IParamContainerElement;
    let deleteParam: (paramContainer: IParamContainerElement) => void;
    let updateFullUrl: () => void;

    export function init(
        _doc: Document,
        deleteParamAction: (paramContainer: IParamContainerElement) => void,
        updateFullUrlAction: () => void) {
        doc = _doc;
        deleteParam = deleteParamAction;
        updateFullUrl = () => {
            setTimeout(() => {
                paramContainer.valueElement.focus();
                updateFullUrlAction();
            }, 0);
        }
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

        // move menu to proper position
        var pos = pressedButton.getBoundingClientRect();
        // pos doesn't contain scroll value so we need to add it
        var posTop = pos.bottom + document.body.scrollTop - 3;
        menuElem.style.top = posTop + "px";
        let posRight = menuElem.parentElement.offsetWidth - pos.right;
        menuElem.style.right = posRight + "px";
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
        menuElem.innerHTML = `
                    <li>
                        <label><input type="checkbox" name="param_urlEncode" />Url encode</label>
                    </li>
                    <li>
                        <label><input type="checkbox" name="param_base64Encode" />Base64 encode</label>
                    </li>
                    <li>
                        <input type="button" value="Delete" name="param_delete" />
                    </li>
                `;

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
                    input["clickAction"] = () => {
                        paramContainer.urlEncoded = menuElem.urlEncodeElem.checked;
                        updateFullUrl();
                    }
                    menuElem.urlEncodeElem = input;
                    break;
                case "param_base64Encode":
                    input["clickAction"] = () => {
                        paramContainer.base64Encoded = menuElem.base64EncodeElem.checked;
                        updateFullUrl();
                    }
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