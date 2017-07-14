/// <reference path="../../../typings/index.d.ts" />
/// <reference path="chrome_mock.ts" />

declare let TEMPLATES: IMap<string>;

module Tests.Canvas {

    let page: HTMLIFrameElement;

    export var chromeMock: ChromeMock;

    export var ready: boolean;

    export function create() {
        // just in case it wasn't dismissed before
        dismiss();

        page = document.createElement("iframe");
        page.setAttribute("style", "resize: both; overflow: auto; width: 416px; height: 400px");
        document.body.appendChild(page);

        // mock Chrom API
        chromeMock = createChromeMock(page.contentWindow, "chrome");
    }

    export function dismiss() {
        page && document.body.removeChild(page);
        page = undefined;
        ready = false;
    }

    export function loadPage(name: string, storage: IMap<any> = { trackingEnabled: false }) {
        // prepend src attributes by a path to app dir and write template to the page
        page.contentWindow.document.write(TEMPLATES[name + ".html"].replace(/ src="/g, ' src="../UrlEditorPro/app/'));

        // delay event triggering to wait for the page elements to be rendered
        setTimeout(function() {
            raiseEvent(page.contentWindow.document, "init", storage);
            ready = true;
        }, 0);
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

    export function raiseEvent(elem: HTMLElement | Document, eventName: string, storage: any) {
        // add support for mouse/keyboard events
        elem.dispatchEvent(new CustomEvent(eventName, { detail: storage }));
    }

    export function getElement(id: string) {
        return page.contentWindow.document.getElementById(id);
    }
}