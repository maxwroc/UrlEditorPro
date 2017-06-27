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
    
    export function detailedObjectComparison(expected: Object, actual: Object, path: string): void {
        if (!expected) {
            switch (typeof expected) {
                case "undefined":
                    expect(actual).toBeUndefined();
                    break;
                case "object":
                    expect(actual).toBeNull();
                    break;
                case "number":
                    expect(actual).toEqual(expected);
                    break;
                default:
                    throw new Error("Unknown object passed for validation");
            }

            return;
        }

        if (!actual) {
            expect(expected).toEqual(actual);
            return;
        }

        for (let i in expected) {
            if (expected.hasOwnProperty(i)) {
                if (!actual.hasOwnProperty(i)) {
                    expect(path + "/ (key is missing)").toEqual(path + "/" + i);
                    continue;
                }
                if (expected[i] !== null && typeof (expected[i]) == "object") {
                    //going on step down in the object tree!!
                    detailedObjectComparison(expected[i], actual[i], path + "/" + i);
                }
                else {
                    let pathCmp = path + "/" + i + ":";
                    expect(pathCmp + expected[i]).toEqual(pathCmp + actual[i]);
                }
            }
        }
    }
}

module UrlEditor.Options {
    export function bindOnInitializedHandler(handler: (s: Settings) => void) {

    }
}