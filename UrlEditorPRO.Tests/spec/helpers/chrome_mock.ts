
module Tests {
    export function createChromeMock(object: Object, key: string) {
        return object[key] = createBase();
    }

    function createBase() {
        let obj = new ChromeMock();

        obj.browserAction = <IBrowserAction>{};
        addExtendedSpy(obj.browserAction, "setIcon");
        addExtendedSpy(obj.browserAction, "setBadgeText");
        addExtendedSpy(obj.browserAction, "setBadgeBackgroundColor");

        obj.commands = <ICommands>{};
        addExtendedSpy(obj.commands, "getAll", 0);
        addEventWithExtendedSpy(obj.commands, "onCommand");

        obj.runtime = <IRuntime>{};
        addExtendedSpy(obj.runtime, "sendMessage");
        addExtendedSpy(obj.runtime, "getManifest", -1, { version: "1.0.2" });
        addEventWithExtendedSpy(obj.runtime, "onMessage");

        obj.tabs = <ITabs>{};
        addExtendedSpy(obj.tabs, "query", 1);
        addExtendedSpy(obj.tabs, "update");
        addExtendedSpy(obj.tabs, "create");
        addEventWithExtendedSpy(obj.tabs, "onActivated");
        addEventWithExtendedSpy(obj.tabs, "onUpdated");

        obj.windows = <IWindows>{};
        addExtendedSpy(obj.windows, "create");

        obj.contextMenus = <IContextMenus>{};
        addExtendedSpy(obj.contextMenus, "create");
        addExtendedSpy(obj.contextMenus, "removeAll");

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
        obj[funcName]["autoFireCallback"] = (...args: any[][]) => {
            let counter = 0;
            spy.and.callFake((...callArgsWithCB) => {
                // take the set of args for given index or the last one if element doesn't exist
                let argsForCallback = args[counter] || args[args.length - 1];
                // fire callback in async way
                setTimeout(() => fireCallbacks(obj[funcName], callbackIndex, [callArgsWithCB], argsForCallback));
                counter++;
            });
        }
    }

    function addEventWithExtendedSpy(obj: any, name: string) {
        obj[name] = <IChromeEvent>{};
        addExtendedSpy(obj[name], "addListener", 0);
    }

    function fireCallbacks(func: IFunctionMock<Function>, callbackIndex: number, callsArgsWithCBs: any[][], argsForCallback: any[]) {
        if (callbackIndex == -1) {
            throw new Error(`Firing callbacks on function argument failed. No defined callbacks on "${func.name}" function.`);
        }

        if (func.spy.calls.allArgs().length == 0) {
            throw new Error(`Firing callbacks on function argument failed. Function "${func.name}" was never called.`);
        }

        callsArgsWithCBs.forEach((argsArray, index) => {
            if (argsArray[callbackIndex] === undefined) {
                throw new Error(`Firing callbacks on function argument failed. Argument [${callbackIndex}] not found on ${index} call to ${func.name}`);
            }

            let handler = <Function>argsArray[callbackIndex]
            handler.apply(null, argsForCallback);
        });
    }

    export class ChromeMock {
        browserAction: IBrowserAction;
        commands: ICommands;
        runtime: IRuntime;
        tabs: ITabs;
        windows: IWindows;
        contextMenus: IContextMenus;
        mocks: IChromeObjectMocks = {
            getTab: (id = 1, url = "http://www.google.com/path?q=r&z=x", incognito = false) => {
                return <chrome.tabs.Tab>{ incognito: incognito, id: id, url: url };
            }
        }

        linkBackgroundInstance(bgInstance: ChromeMock) {
            let onMessageListeners: Function[] = [];

            // collect all listeners
            bgInstance.runtime.onMessage.addListener.spy.and.callFake(callback => {
                onMessageListeners.push(callback);
            });

            this.runtime.sendMessage.spy.and.callFake((msg: any, responseCallback: Function) => {
                // call all callbacks in async way
                onMessageListeners.forEach(cb => setTimeout(cb.apply(bgInstance, [msg, null, responseCallback])));
            })
        }
    }

    interface IBrowserAction {
        setIcon: IFunctionMock<void>;
        setBadgeText: IFunctionMock<void>;
        setBadgeBackgroundColor: IFunctionMock<void>;
    }

    interface ICommands {
        getAll: IFunctionMock<void>;
        onCommand: IChromeEvent;
    }

    interface IRuntime {
        getManifest: IFunctionMock<{ version: string }>;
        sendMessage: IFunctionMock<void>;
        onMessage: IChromeEvent;
    }

    interface IContextMenus {
        create: IFunctionMock<void>;
        removeAll: IFunctionMock<void>;
    }

    interface IChromeEvent {
        addListener: IFunctionMock<void>
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
        fireCallbacksFromAllCalls: (...callbackArgs: any[]) => void;

        /**
         * Fires callback from last function call
         */
        fireCallbackFromLastCall: (...callbackArgs: any[]) => void;

        /**
         * Fires callbacks automatically in async way
         *
         * You can pass ordered collection of arguments which will be used in calls.
         * If there are more calls than elements in collection the last one will be
         * used for remaining onces
         *
         * E.g. In the below example all callbacks passed to "query" function will be
         * called a moment after. First callback will receive Tab with id=1 and all
         * the rest of them Tab with id=2:
         *  chrome.tabs.query.autoFireCallbacks(
         *      [
         *          [chrome.mocks.getTab(1)],
         *          [chrome.mocks.getTab(2)]
         *      ]
         *  );
         */
        autoFireCallback: (...callbackArgs: any[][]) => void;
    }

    interface IChromeObjectMocks {
        getTab: () => chrome.tabs.Tab
    }
}