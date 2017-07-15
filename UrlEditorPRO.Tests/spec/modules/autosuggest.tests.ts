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

            expect(Canvas.ready).toBeTruthy();
            
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });
            
            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());
        });
    });





}