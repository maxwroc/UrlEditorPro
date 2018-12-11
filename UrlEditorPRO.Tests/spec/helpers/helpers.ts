module Tests {
    export function all(description, callArguments: any[][], testFunction: Function) {
        callArguments.forEach(args => {
            it(`${description}; Case: ${JSON.stringify(args)}`, () => {
                testFunction.apply(null, args);
            });
        });
    }

    export function allAsync(description, callArguments: any[][], testFunction: (done: () => void, ...args: any[]) => void) {
        callArguments.forEach(args => {
            it(`${description}; Case: ${JSON.stringify(args)}`, (done) => {
                args.unshift(done);
                testFunction.apply(null, args);
            });
        });
    }

    /**
     * Polls an escape function until escape function returns true
     */
    export function waitUntil<T>(escapeFunction: () => boolean, returnValue: T = null, checkDelay: number = 1): Promise<T> {
        return new Promise((resolve, reject) => {
            var timeout = setTimeout(() => reject("Waiting for an event to trigger timed out"), 10000);
            var interval = setInterval(function () {
                if (escapeFunction()) {
                    clearInterval(interval);
                    resolve(returnValue);
                }
            }, checkDelay);
        });
    };

    export function createElement<T extends HTMLElement>(tagName: string, id?: string, className?: string): T {
        let elem = document.createElement(tagName);
        id && elem.setAttribute("id", id);
        className && elem.setAttribute("class", className);
        return <T>elem;
    }

    /**
     * Compares objects showing more precise failure reason.
     *
     * @param expected      Value which is a baseline to check
     * @param actual        The actual value used to test
     * @param path          Current path (used to visualize object depth)
     * @param exactMatch    Whether to check if objects have exactly the same structure. By default it just checks
     *                      if expected values exist without validating if some others are there as well.
     */
    export function detailedObjectComparison(expected: Object, actual: Object, path: string, exactMatch = false): void {
        let validationFailed = false;

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

        if (exactMatch && typeof expected == "object") {
            let actualVal = "/" + JSON.stringify(Object.keys(actual));
            let expectedVal = "/" + JSON.stringify(Object.keys(expected));
            expect(path + actualVal).toEqual(path + expectedVal);
            if (expectedVal != actualVal) {
                // it doesn't make sense to check further
                return;
            }
        }

        for (let i in expected) {
            if (expected.hasOwnProperty(i)) {
                if (!actual.hasOwnProperty(i)) {
                    expect(path + "/ (key is missing)").toEqual(path + "/" + i);
                    validationFailed = true;
                    continue;
                }
                if (expected[i] !== null && typeof (expected[i]) == "object") {
                    //going on step down in the object tree!!
                    detailedObjectComparison(expected[i], actual[i], path + "/" + i, exactMatch);
                }
                else {
                    let pathCmp = path + "/" + i + ":";
                    expect(pathCmp + expected[i]).toEqual(pathCmp + actual[i]);
                }
            }
        }

        if (validationFailed) {
            console.log("Failed - objects not the same expected/actual [" + path + "]");
            console.log(JSON.stringify(expected, null, 2));
            console.log(JSON.stringify(actual, null, 2));
        }
    }
}
