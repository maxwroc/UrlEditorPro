/// <reference path="../helpers/canvas.ts" />
/// <reference path="../helpers/helpers.ts" />

module Tests.Autosuggest {

    function loadPopupAndWaitUntilInitialized(chrome: ChromeMock) {
        return Canvas.loadPage("popup", null)
            // wait for html to load
            .then(() => {
                Canvas.init({});
                return waitUntil(() => chrome.tabs.query.spy.calls.count() > 0)
            })
            // wait for initialization
            .then(() => {
                chrome.tabs.query.fireCallbacksFromAllCalls([chrome.mocks.getTab()]);
            });
    }

    describe("Autorefresh test validating if", () => {

        const AutoRefreshButtonSelector = "*[for='refresh_check']";
        const AutoRefreshModuleSelector = "#refresh_check ~ *";
        let chrome: ChromeMock;

        beforeEach(done => {
            Canvas.create();
            chrome = createChromeMock(Canvas.getWindow(), "chrome");

            loadPopupAndWaitUntilInitialized(chrome)
                .then(() => done())
        });

        it("button is shown after clicking on Page Options", (done) => {
            expect(Canvas.isVisible(AutoRefreshButtonSelector)).toBeFalsy();

            // showing page options menu
            Canvas.PopupElements.getPageOptions().simulateClick()
                .then(() => {
                    expect(Canvas.isVisible(AutoRefreshButtonSelector)).toBeTruthy();
                    done();
                });
        });

        it("module is hidden after clicking cancel button", (done) => {
            openAutoRefreshModule()
                .then(mod => {
                    return Canvas.click(mod.cancelButton);
                }).then(() => {
                    expect(Canvas.isVisible(AutoRefreshModuleSelector)).toBeFalsy();
                    done();
                });
        });

        it("clicking on AutoRefresh option shows module", (done) => {
            // callback will be executed only if module became visible
            openAutoRefreshModule()
                .then(() => done());
        });

        allAsync("clicking on Start button initializes refresh interval",
            [
                ["14s", 14],
                ["2m", 120],
                ["3h", 60 * 60 * 3]
            ],
            (done, inputValue, expectedInterval) => {

            openAutoRefreshModule()
                .then(mod => {
                    mod.inputField.value = inputValue;
                    let before = chrome.tabs.query.spy.calls.count();
                    Canvas.click(mod.startButton);
                    return waitUntil(() => chrome.tabs.query.spy.calls.count() != before, mod);
                })
                .then(mod => {
                    // trigger callback return
                    chrome.tabs.query.fireCallbackFromLastCall([chrome.mocks.getTab()]);

                    let message = chrome.runtime.sendMessage.spy.calls.argsFor(0)[0];
                    expect(message).toEqual({ type: "AutoRefresh", command: "setInterval", tabId: 1, interval: expectedInterval });
                    done();
                });
        });

        function openAutoRefreshModule() {
            // click on PageOptions button to show page options menu
            Canvas.PopupElements.getPageOptions().simulateClick();

            // wait for it to show up
            return waitUntil(() => Canvas.isVisible(AutoRefreshButtonSelector))
                .then(() => {
                    // click on AutoRefresh button
                    Canvas.click(AutoRefreshButtonSelector);
                    // wait for the module to show up
                    return waitUntil(() => Canvas.isVisible(AutoRefreshModuleSelector))
                })
                .then(() => {
                    let startButton = Canvas.getElementById("set_refresh_interval");
                    return {
                        startButton: startButton as HTMLInputElement,
                        cancelButton: startButton.nextElementSibling as HTMLLabelElement,
                        inputField: startButton.previousElementSibling as HTMLInputElement
                    }
                });
        }
    });
}