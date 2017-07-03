module Tests.Canvas {

    let page: HTMLIFrameElement;

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

    export function loadPage(name: string) {
        page.src = `../UrlEditorPro/app/${name}.html`;
    }

    export function createElement<T extends HTMLElement>(tagName: string, container?: HTMLElement, attributes?: IMap<string>): T {
        let elem = page.contentWindow.document.createElement(tagName);

        if (attributes) {
            Object.keys(attributes).forEach(name => elem.setAttribute(name, attributes[name]));
        }

        if (!container) {
            page.contentWindow.document.body.appendChild(elem);
        }

        return <T>elem;
    }

    export function raiseEvent(elem: HTMLElement, eventName: string) {
        // add support for mouse/keyboard events
        let evt = page.contentWindow.document.createEvent("HTMLEvents");
        evt.initEvent(eventName, true, true);
        elem.dispatchEvent(evt);
    }
}