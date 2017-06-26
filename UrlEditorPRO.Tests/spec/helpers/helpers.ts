module Tests {
    export function all(description, callArguments: any[][], testFunction: Function) {
        callArguments.forEach(args => {
            it(`${description}; Case: ${JSON.stringify(args)}`, () => {
                testFunction.apply(null, args);
            });
        });
    }

    export function createElement<T extends HTMLElement>(tagName: string, id?: string, className?: string): T {
        let elem = document.createElement(tagName);
        id && elem.setAttribute("id", id);
        className && elem.setAttribute("class", className);
        return <T>elem;
    }
}

module UrlEditor.Options {
    export function bindOnInitializedHandler() {

    }
}