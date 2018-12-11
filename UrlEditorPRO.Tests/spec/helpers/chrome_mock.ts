
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
        addExtendedSpy(obj.runtime, "sendMessage");
        obj.tabs = <ITabs>{};
        addExtendedSpy(obj.tabs, "query", 1);
        addExtendedSpy(obj.tabs, "update");
        addExtendedSpy(obj.tabs, "create");
        obj.windows = <IWindows>{};
        addExtendedSpy(obj.windows, "create");
        return obj;
    }

    /**
     * Sets Jasmine Spy on given function.
     *
     * @description If function doesn't exist it creates it. Spy object is available in "spy" function property. In addition
     * it creates "fireCallbacks" property which can be used to easily fire callback params from given param index.
     *
     * @param obj Container object in which function is defined
     * @param funcName Name of the function
     * @param callbackIndex Index number of callback parameter (if any)
     * @param returnValue Value to be returned.
     */
    function addExtendedSpy(obj: any, funcName: string, callbackIndex = -1, returnValue?: any) {
        if (obj[funcName] === undefined) {
            obj[funcName] = () => returnValue;
        }

        let spy = spyOn(obj, funcName).and.callThrough();
        obj[funcName]["spy"] = spy;
        obj[funcName]["fireCallbacksFromAllCalls"] = (...args) =>
            fireCallbacks(obj[funcName], callbackIndex, spy.calls.allArgs(), args);
        obj[funcName]["fireCallbackFromLastCall"] = (...args) =>
            fireCallbacks(obj[funcName], callbackIndex, [spy.calls.mostRecent().args], args);
    }

    function fireCallbacks(func: IFunctionMock<Function>, callbackIndex: number, callsArgs: any[][], callbackArgs: any[]) {
        if (callbackIndex == -1) {
            throw new Error(`Firing callbacks on function argument failed. No defined callbacks on "${func.name}" function.`);
        }

        if (func.spy.calls.allArgs().length == 0) {
            throw new Error(`Firing callbacks on function argument failed. Function "${func.name}" was never called.`);
        }

        callsArgs.forEach((argsArray, index) => {
            if (argsArray[callbackIndex] === undefined) {
                throw new Error(`Firing callbacks on function argument failed. Argument [${callbackIndex}] not found on ${index} call to ${func.name}`);
            }

            let handler = <Function>argsArray[callbackIndex]
            handler.apply(null, callbackArgs);
        });
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
        sendMessage: IFunctionMock<void>;
    }

    interface ITabs {
        query: IFunctionMock<any>;
        create: ({ url: string }) => void;
        update: (id: number, { url: string }) => void;
    }

    interface IWindows {
        create: ({ url: string }) => void;
    }

    interface IFunctionMock<T> {
        (): T;

        /**
         * Jasmine Spy object
         */
        spy: jasmine.Spy;

        /**
         * Fires collbacks from all function calls
         */
        fireCallbacksFromAllCalls: (...callbackArgs) => void;

        /**
         * Fires callback from last function call
         */
        fireCallbackFromLastCall: (...callbackArgs) => void;
    }

    interface IChromeObjectMocks {
        getTab: () => chrome.tabs.Tab
    }
}