
module Tests {
    export function createChromeMock(object: Object, key: string) {
        return object[key] = createBase();
    }

    function createBase() {
        let obj = new ChromeMock();
        obj.browserAction = <IBrowserAction>{};
        addExtendedSpy(obj.browserAction, "setIcon", -1);
        obj.commands = <ICommands>{};
        addExtendedSpy(obj.commands, "getAll", 0);
        obj.runtime = <IRuntime>{};
        addExtendedSpy(obj.runtime, "getManifest", -1, { version: "1.0.2" });
        obj.tabs = <ITabs>{};
        addExtendedSpy(obj.tabs, "getSelected", 1);
        addExtendedSpy(obj.tabs, "update");
        addExtendedSpy(obj.tabs, "create");
        obj.windows = <IWindows>{};
        addExtendedSpy(obj.windows, "create");
        return obj;
    }

    function addExtendedSpy(obj: any, funcName: string, callbackIndex = -1, returnValue?: any) {
        if (obj[funcName] === undefined) {
            obj[funcName] = () => returnValue;
        }

        let spy = spyOn(obj, funcName).and.callThrough();
        obj[funcName]["spy"] = spy;

        obj[funcName]["fireCallbacks"] = (...args) => {
            if (callbackIndex == -1) {
                throw new Error(`Firing callbacks on function argument failed. No defined callbacks on "${funcName}" function.`);
            }

            if (spy.calls.allArgs().length == 0) {
                throw new Error(`Firing callbacks on function argument failed. Function "${funcName}" was never called.`);
            }

            spy.calls.allArgs().forEach((argsArray, index) => {
                if (argsArray[callbackIndex] === undefined) {
                    throw new Error(`Firing callbacks on function argument failed. Argument [${callbackIndex}] not found on ${index} call to ${funcName}`);
                }

                let handler = <Function>argsArray[callbackIndex]
                handler.apply(null, args);
            });
        }
    }

    export class ChromeMock {
        public browserAction: IBrowserAction;
        public commands: ICommands;
        public runtime: IRuntime;
        public tabs: ITabs;
        public windows: IWindows;
        public mocks: IChromeObjectMocks = {
            getTab: () => {
                return <chrome.tabs.Tab>{ incognito: false, id: 1, url: "http://www.google.com/path?q=r&z=x" };
            }
        }
    }

    interface IBrowserAction {
        setIcon: IFunctionMock<void>;
    }

    interface ICommands {
        getAll: IFunctionMock<void>;
    }

    interface IRuntime {
        getManifest: IFunctionMock<{ version: string }>;
    }

    interface ITabs {
        getSelected: IFunctionMock<any>;
        create: ({ url: string }) => void;
        update: (id: number, { url: string }) => void;
    }

    interface IWindows {
        create: ({ url: string }) => void;
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