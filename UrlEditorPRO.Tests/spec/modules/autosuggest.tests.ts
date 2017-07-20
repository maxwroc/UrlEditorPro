/// <reference path="../helpers/canvas.ts" />

declare var $;

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

            $(getParam(0).getName()).simulate("key-sequence", { sequence: "test" });
            //expect(getParam(0).getName().value).toEqual("q");
        });

        function getParam(index: number) {

            let container = Canvas.getElement("params");
            return {
                getName: () => <HTMLInputElement>container.querySelector(`.param:nth-of-type(${index + 1}) input:nth-of-type(1)`),
                getValue: () => <HTMLInputElement>container.querySelector(`.param:nth-of-type(${index + 1}) input:nth-of-type(2)`)
            }
        }
    });





}