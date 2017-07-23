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
        setTimeout(function () {
            if (storage) {
                init(storage);
            }

            ready = true;
        }, 0);
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

    export function click(elem: HTMLElement) { 
        $(elem).trigger("click");
    }

    export function raiseEvent(elem: HTMLElement | Document, eventType: string, eventData: IMap<any> = {}) {
        let evt: Event;
        switch (eventType) {
            case "init":
                if (!eventData.storage) {
                    throw new Error("Missing 'storage' property on the eventData object which is required for Init event");
                }
                evt = new CustomEvent("init", { detail: eventData.storage });
                break;;
        }

        if (evt) {
            elem.dispatchEvent(evt);
        }
    }

    export function getElementById(id: string) {
        return page.contentWindow.document.getElementById(id);
    }

    export function getElementBySelector(selector: string) {
        return page.contentWindow.document.body.querySelector(selector);
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

    export class Elements {
        static getFullUrl() {
            return page.contentWindow.document.getElementById("full_url");
        }

        static getGoButton() {
            return page.contentWindow.document.getElementById("go");
        }
    }
}