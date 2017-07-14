
module Tests {
    export function createChromeMock(object: Object, key: string) {
        return object[key] = createBase();
    }

    function createBase() {
        let obj = new ChromeMock();
        obj.runtime = <IRuntime>{};
        addExtendedSpy(obj.runtime, "getManifest", -1, { version: "1.0.2" });
        obj.tabs = <ITabs>{};
        addExtendedSpy(obj.tabs, "getSelected", 1);
        return obj;
    }

    function addExtendedSpy(obj: any, funcName: string, callbackIndex: number, returnValue?: any) {
        if (obj[funcName] === undefined) {
            obj[funcName] = () => returnValue;
        }

        let spy = spyOn(obj, funcName).and.callThrough();
        obj[funcName]["spy"] = spy;

        obj[funcName]["fireCallbacks"] = (...args) => {
            if (spy.calls.allArgs().length == 0) {
                throw new Error(`Function ${funcName} was never called.`);
            }

            spy.calls.allArgs().forEach((argsArray, index) => {
                if (argsArray[callbackIndex] === undefined) {
                    throw new Error(`Argument [${callbackIndex}] not found on ${index} call to ${funcName}`);
                }

                let handler = <Function>argsArray[callbackIndex]
                handler.apply(null, args);
            });
        }
    }

    export class ChromeMock {
        public runtime: IRuntime;
        public tabs: ITabs;
        public mocks: IChromeObjectMocks = {
            getTab: () => {
                return <chrome.tabs.Tab>{ incognito: false, id: 1, url: "http://google.com/path?q=r&z=x" };
            }
        }
    }

    interface IRuntime {
        getManifest: IFunctionMock<{ version: string }>;
    }

    interface ITabs {
        getSelected: IFunctionMock<any>;
    }

    interface IFunctionMock<T> {
        (): T;
        fireCallbacks: (...args) => void;
        spy: jasmine.Spy;
    }

    interface IChromeObjectMocks {
        getTab: () => chrome.tabs.Tab
    }
}