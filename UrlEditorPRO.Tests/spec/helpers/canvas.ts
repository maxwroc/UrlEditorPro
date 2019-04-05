/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../UrlEditorPRO/app/shared/interfaces.shared.d.ts" />

declare let TEMPLATES: IMap<string>;
declare let $;

module Tests.Canvas {

    let page: HTMLIFrameElement;
    let backgroundPage: HTMLIFrameElement;

    let scrollBarWidth = 17;

    export var ready: boolean;

    export function create(createBackgroundPage = false) {
        // just in case it wasn't dismissed before
        dismiss();

        page = createPageContainer();
        if (createBackgroundPage) {
            backgroundPage = createPageContainer("BackgroundPageContainer");
        }
    }

    export function dismiss() {
        page && document.body.removeChild(page);
        backgroundPage && document.body.removeChild(backgroundPage);

        page = null;
        backgroundPage = null;
        ready = false;
    }

    export function loadPage(name: string, storage?: IMap<any>) {

        if (backgroundPage) {
            // loading background script
            backgroundPage.contentWindow.document.write('<script src="/base/UrlEditorPRO/app/background.js"></script>');
        }

        // prepend src attributes by a path to app dir and write template to the page (skip absolute urls)
        page.contentWindow.document.write(TEMPLATES[name + ".html"].replace(/ src="(?!https?:\/\/)/g, ' src="/base/UrlEditorPRO/app/'));

        // delay event triggering to wait for the page elements to be rendered
        return waitUntil(() => !!getElementBySelector("div"))
            .then(() => {
                if (storage) {
                    init(storage);
                }

                ready = true;
            });
    }

    export function init(storage: IMap<any> = { trackingEnabled: false }) {
        // first we initialize background page if exists
        if (backgroundPage) {
            raiseEvent(backgroundPage.contentWindow.document, "init", { "storage": storage });
        }

        // main page initialization
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

    export function click(elemOrSelector: HTMLElement | string): Promise<HTMLElement> {
        if (typeof (elemOrSelector) == "string") {
            elemOrSelector = getElementBySelector(elemOrSelector) as HTMLElement;
        }

        $(elemOrSelector).simulate("mousedown");
        $(elemOrSelector).simulate("click");
        $(elemOrSelector).simulate("mouseup");

        // release thread and allow events to dispatch
        return new Promise(resolve => setTimeout(() => resolve(elemOrSelector as HTMLElement), 1));
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

    export function getBackgroundWindow() {
        return backgroundPage.contentWindow;
    }

    export function isVisible(elem: HTMLElement | string) {
        if (typeof (elem) == "string") {
            elem = Canvas.getElementBySelector(elem) as HTMLElement;
        }

        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
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
        static getPageOptions() {
            return extendButtonElement(<HTMLInputElement>getElementById("options"));
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

    export function createPageContainer(name: string = "PageContainer") {
        let container = document.createElement("iframe");
        container.setAttribute("style", "resize: both; overflow: auto; width: 416px; height: 400px");
        container.setAttribute("name", name);
        container.setAttribute("id", name);
        document.body.appendChild(container);

        return container;
    }

    /**
     * Resizes page window to fit entire content when scrollbar appears.
     */
    export function adjustPageWidth() {
        const body = getWindow().document.body;
        if (body.scrollHeight > page.offsetHeight) {
            page.style.width = (body.scrollWidth + 16 + scrollBarWidth + 1) + "px";
        }
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
        simulateClick: () => Promise<void>;
    }

    /**
     * Adds "simulate" actions
     * @param inputElem Element to extend
     */
    function extendButtonElement(inputElem: HTMLInputElement) {
        let ext = <HTMLInputElementExt>inputElem;
        ext.simulateClick = () => {
            Canvas.click(inputElem);
            return new Promise(resolve => {
                // release the thread and allow event to dispatch
                setTimeout(() => resolve(), 1);
            })
        }

        return ext;
    }

    // measure scrollbar width
    $(() => {
        var scrollDiv = document.createElement("div");
        scrollDiv.setAttribute("style", "width: 100px; overflow: scroll; position: absolute; top: -200px");
        document.body.appendChild(scrollDiv);

        // give some time to render
        setTimeout(() => {
            scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
            document.body.removeChild(scrollDiv);
        });
    });
}