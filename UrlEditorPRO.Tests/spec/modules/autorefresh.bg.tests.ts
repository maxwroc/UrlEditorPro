/// <reference path="../helpers/canvas.ts" />
/// <reference path="../helpers/helpers.ts" />

module Tests.Autosuggest {

    const AutoRefreshButtonSelector = "*[for='refresh_check']";
    const AutoRefreshModuleSelector = "#refresh_check ~ *";

    let chromeMock: ChromeMock;
    let backgroundChromeMock: ChromeMock;

    function loadPopupAndWaitUntilInitialized(chrome: ChromeMock) {
        return Canvas.loadPage("popup", null)
            // wait for html to load
            .then(() => {
                Canvas.init({});
                return waitUntil(() => chrome.tabs.query.spy.calls.count() > 0)
            });
    }

    describe("Autorefresh background page integration test validating if", () => {

        beforeEach(done => {
            Canvas.create(true);
            chromeMock = createChromeMock(Canvas.getWindow(), "chrome");
            backgroundChromeMock = createChromeMock(Canvas.getBackgroundWindow(), "chrome");

            chromeMock.tabs.query.autoFireCallback([[chromeMock.mocks.getTab()]]);
            backgroundChromeMock.tabs.query.autoFireCallback([[chromeMock.mocks.getTab()]]);

            // to pass through messages
            chromeMock.linkBackgroundInstance(backgroundChromeMock);

            loadPopupAndWaitUntilInitialized(chromeMock)
                .then(() => done())
        });

        it("badge text is updated every sec", done => {
            startAutoRefresh("3s")
                .then(() => {
                    return waitUntil(() => backgroundChromeMock.tabs.reload.spy.calls.count() > 0, null, 500, 5000);
                })
                .then(() => {
                    let tabId = chromeMock.mocks.getTab().id;
                    expect(backgroundChromeMock.browserAction.setBadgeText.spy.calls.count()).toEqual(3);

                    expect(backgroundChromeMock.browserAction.setBadgeText.spy.calls.argsFor(0)).toEqual([{ tabId: tabId, text: "2s" }]);
                    expect(backgroundChromeMock.browserAction.setBadgeBackgroundColor.spy.calls.argsFor(0)).toEqual([{ tabId: tabId, color: "green" }]);

                    expect(backgroundChromeMock.browserAction.setBadgeText.spy.calls.argsFor(1)).toEqual([{ tabId: tabId, text: "1s" }]);
                    expect(backgroundChromeMock.browserAction.setBadgeBackgroundColor.spy.calls.argsFor(1)).toEqual([{ tabId: tabId, color: "green" }]);

                    // in the same time when reload happens badge is being updated with restarted counter
                    expect(backgroundChromeMock.browserAction.setBadgeText.spy.calls.argsFor(2)).toEqual([{ tabId: tabId, text: "3s" }]);
                    expect(backgroundChromeMock.browserAction.setBadgeBackgroundColor.spy.calls.argsFor(2)).toEqual([{ tabId: tabId, color: "green" }]);
                    done();
                })
                .catch(reason => {
                    expect(reason).toBeFalsy();
                });
        });

        function startAutoRefresh(time: string) {
            return openAutoRefreshModule()
                .then(mod => {
                    mod.inputField.value = time;
                    let before = chromeMock.tabs.query.spy.calls.count();
                    Canvas.click(mod.startButton);
                    return waitUntil(() => chromeMock.tabs.query.spy.calls.count() != before, mod);
                })
                .then(mod => {
                    return waitUntil(() => chromeMock.runtime.sendMessage.spy.calls.count() > 0, mod);
                });
        }

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