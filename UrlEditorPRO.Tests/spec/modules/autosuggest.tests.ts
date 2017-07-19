/// <reference path="../helpers/canvas.ts" />

module Tests.Autosuggest {

    describe("test", () => {

        let autoSuggestData: UrlEditor.IAutoSuggestData = {
            "www.google.com": {
                "param1": ["param1_val1", "param1_val2"]
            }
        }

        let chrome: ChromeMock;

        beforeEach(done => {
            Canvas.create();
            Canvas.loadPage("popup", null /* prevent from initialization */);
            chrome = createChromeMock(Canvas.getWindow(), "chrome");

            // make sure that DOM is ready
            waitUntil(() => Canvas.ready).then(() => done());
        })

        it("test", () => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let param = getParam(0);
            expect(param.getName().value).toEqual("q");
            Canvas.type(param.getValue(), "param");
        });

        function getParam(index: number) {

            let container = Canvas.getElement("params");
            return {
                getName: () => <HTMLInputElement>container.querySelector(`.param:nth-of-type(${index+1}) input:nth-of-type(1)`),
                getValue: () => <HTMLInputElement>container.querySelector(`.param:nth-of-type(${index+1}) input:nth-of-type(2)`)
            }
        }
    });





}