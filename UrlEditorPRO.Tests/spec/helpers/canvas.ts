/// <reference path="../../../typings/index.d.ts" />
/// <reference path="chrome_mock.ts" />

declare let TEMPLATES: IMap<string>;
declare let $;

module Tests.Canvas {

    let page: HTMLIFrameElement;

    export var ready: boolean;

    export function create() {
        // just in case it wasn't dismissed before
        dismiss();

        page = document.createElement("iframe");
        page.setAttribute("style", "resize: both; overflow: auto; width: 416px; height: 400px");
        document.body.appendChild(page);
    }

    export function dismiss() {
        page && document.body.removeChild(page);
        page = undefined;
        ready = false;
    }

    export function loadPage(name: string, storage?: IMap<any>) {
        // prepend src attributes by a path to app dir and write template to the page
        page.contentWindow.document.write(TEMPLATES[name + ".html"].replace(/ src="/g, ' src="../UrlEditorPro/app/'));

        // delay event triggering to wait for the page elements to be rendered
        waitUntil(() => !!getElementBySelector("div"))
            .then(() => {
                if (storage) {
                    init(storage);
                }

                ready = true;
            });
    }

    export function init(storage: IMap<any> = { trackingEnabled: false }) {
        raiseEvent(page.contentWindow.document, "init", { "storage": storage });
    }

    export function createElement<T extends HTMLElement>(tagName: string, container?: HTMLElement, attributes?: IMap<string>): T {
        let elem = page.contentWindow.document.createElement(tagName);

        if (attributes) {
            Object.keys(attributes).forEach(name => elem.setAttribute(name, attributes[name]));
        }

        if (container === undefined) {
            page.contentWindow.document.body.appendChild(elem);
        }

        return <T>elem;
    }

    export function type(elem: HTMLInputElement, text: string) {
        $(elem).simulate("key-sequence", { sequence: text });
        elem.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    }

    export function keyboardCombination(elem: HTMLElement, combination: string) {
        $(elem).simulate("key-combo", { combo: combination });
    }

    export function click(elem: HTMLElement) {
        $(elem).simulate("mousedown");
        $(elem).simulate("click");
        $(elem).simulate("mouseup");
    }

    export function raiseEvent(elem: HTMLElement | Document, eventType: string, eventData: IMap<any> = {}) {
        let evt: Event;
        switch (eventType) {
            case "init":
                if (!eventData.storage) {
                    throw new Error("Missing 'storage' property on the eventData object which is required for Init event");
                }
                evt = new CustomEvent("init", { detail: eventData.storage });
                break;
            case "change":
                evt = page.contentWindow.document.createEvent("HTMLEvents");
                evt.initEvent(eventType, true, true);
                break;
        }

        if (evt) {
            elem.dispatchEvent(evt);
        }
    }

    export function getElementById(id: string, throwIfMissing = false) {
        let elem = page.contentWindow.document.getElementById(id);
        if (throwIfMissing && !elem) {
            throw new Error(`Element with id "${id}" not found. Please make sure the pane is loaded already.`);
        }

        return elem;
    }

    export function getElementBySelector(selector: string, throwIfMissing = false) {
        // add a sfety check as we use this function to probe if pane is loaded
        let elem = page.contentWindow.document.body && page.contentWindow.document.body.querySelector(selector);
        if (throwIfMissing && !elem) {
            throw new Error(`Failed to find element by selector: ${selector}. Please make sure the pane is loaded already.`);
        }
        return elem;
    }

    export function getElementsBySelector(selector: string) {
        return page.contentWindow.document.body.querySelectorAll(selector);
    }

    export function getActiveElement() {
        return page.contentWindow.document.activeElement;
    }

    export function getWindow() {
        return page.contentWindow;
    }

    export class PopupElements {
        static getFullUrl() {
            return <HTMLTextAreaElement>getElementById("full_url", true);
        }

        static getGoButton() {
            return extendButtonElement(<HTMLInputElement>getElementById("go", true));
        }
        static getVersion() {
            return <HTMLSpanElement>getElementById("version", true);
        }
        static getAddParamButton() {
            return extendButtonElement(<HTMLInputElement>getElementById("add_param"));
        }
    }

    export module OptionsElements {
        export class Suggestions {
            static getDomainList() {
                return extendSelectElem(<HTMLSelectElement>getElementById("autoSuggestPages", true));
            }
            static getParamList() {
                return extendSelectElem(<HTMLSelectElement>getElementById("autoSuggestParams", true));
            }
            static getValueList() {
                return <HTMLDivElement>getElementById("autoSuggestParamValues", true);
            }
            static getBindDomainList() {
                return extendSelectElem(<HTMLSelectElement>getElementById("autoSuggestPageToBind", true));
            }
            static getSaveButton() {
                return extendButtonElement(<HTMLInputElement>getElementBySelector("#autoSuggestPageToBind + input", true));
            }
        }
    }

    export interface HTMLSelectElementExt extends HTMLSelectElement {
        simulateSelectItem(name: string): void;
        getButtonSimbling(): HTMLInputElementExt;
        getValueText(): string;
    }

    function extendSelectElem(selectElem: HTMLSelectElement) {
        let ext = <HTMLSelectElementExt>selectElem;
        ext.simulateSelectItem = (name: string) => {
            for (var index = 0; index < selectElem.options.length; index++) {
                if (selectElem.options[index].text == name) {
                    selectElem.selectedIndex = index;
                    raiseEvent(selectElem, "change");
                    return;
                }
            }

            console.log("Select element without searched option", selectElem);
            throw new Error("Option with given name not found:" + name);
        };

        ext.getButtonSimbling = () => {
            return extendButtonElement($(selectElem).next("input"));
        }

        ext.getValueText = () => selectElem.item(selectElem.selectedIndex).textContent;

        return ext;
    }

    export interface HTMLInputElementExt extends HTMLInputElement {
        simulateClick: () => void;
    }

    function extendButtonElement(inputElem: HTMLInputElement) {
        let ext = <HTMLInputElementExt>inputElem;
        ext.simulateClick = () => {
            Canvas.click(inputElem);
        }

        return ext;
    }
}