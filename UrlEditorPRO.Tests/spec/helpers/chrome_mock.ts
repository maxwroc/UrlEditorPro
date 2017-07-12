
module Tests {
    export function createChromeMock(object: Object, key: string) {
        return object[key] = createBase();
    }

    function createBase() {
        let obj = new ChromeMock();
        obj.runtime = <IRuntime>{};
        addExtendedSpy(obj.runtime, "getManifest", -1, { version: "1.0.2" });
        obj.tabs = <ITabs>{};
        addExtendedSpy(obj.tabs, "getSelected", 0);
        return obj;
    }

    function addExtendedSpy(obj: any, funcName: string, callbackIndex: number, returnValue?: any) {
        if (obj[funcName] === undefined) {
            obj[funcName] = () => returnValue;
        }

        let spy = spyOn(obj, funcName);
        obj["spy"] = spy;

        obj["fireCallbacks"] = (...args) => {
            if (spy.calls.allArgs.length == 0) {
                throw new Error(`Function ${funcName} was never called.`);
            }

            spy.calls.allArgs().forEach((argsArray, index) => {
                if (argsArray[callbackIndex] === undefined) {
                    throw new Error(`Argument [${callbackIndex}] not found on ${index} call to ${funcName}`);
                }

                let handler = <Function>argsArray[index][callbackIndex]
                handler.apply(null, args);
            });
        }
    }

    class ChromeMock {
        public runtime: IRuntime;
        public tabs: ITabs;
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
}