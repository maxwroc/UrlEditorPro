/// <reference path="../../../typings/index.d.ts" />

declare let TEMPLATES: IMap<string>;

module Tests.Canvas {

    let page: HTMLIFrameElement;

    export var chromeMock;

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
    }

    export function loadPage(name: string, initialize?: boolean, storage: any = {}) {
        // prepend src attributes by a path to app dir and write template to the page
        page.contentWindow.document.write(TEMPLATES[name + ".html"].replace(/ src="/g, ' src="../UrlEditorPro/app/'));
        // mock Chrom API
        chromeMock = createChromeMock(page.contentWindow, "chrome");

        if (initialize) {
            // delay event triggering to wait for the page elements to be rendered
            setTimeout(function() {
                raiseEvent(page.contentWindow.document, "init", storage);
            }, 0);
        }
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