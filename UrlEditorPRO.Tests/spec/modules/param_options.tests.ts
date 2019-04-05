/// <reference path="../helpers/canvas.ts" />
/// <reference path="../helpers/helpers.ts" />

module Tests.Autosuggest  {
    describe("User interface test validating if", () => {

        let chrome: ChromeMock;

        beforeEach(() => {
            Canvas.create();
            chrome = createChromeMock(Canvas.getWindow(), "chrome");
        });

        allAsync("position of param-menu is correct when pane scrolled", [[4, 2], [100, 2]], (done, numberOfParams, buttonIndex) => {
            const url = "https://httpbin.org/get?" + [...Array(numberOfParams).keys()].map(i => `${i}=${i}`).join("&");
            const menuMargin = 2;

            loadPopupAndWaitUntilInitialized(url)
                .then(() => {
                    let buttons = Canvas.getElementsBySelector("#params .param > input[type=button]") as NodeListOf<HTMLInputElement>;

                    expect(buttons).toBeTruthy();
                    expect(buttons.length).toEqual(numberOfParams);

                    // adjust width when scrollbar appears
                    Canvas.adjustPageWidth();

                    // select button which is hidden - scroll has to be used
                    buttons[buttonIndex].focus();
                    return Canvas.click(buttons[buttonIndex]);
                })
                .then(button => {
                    const menuCoords = Canvas.getElementBySelector("#paramMenu").getBoundingClientRect();
                    const buttonCoords = button.getBoundingClientRect();

                    expect(menuCoords.top).toEqual(buttonCoords.top + menuMargin);
                    // Measuring scrollbar is not perfect - allowing 1px diff
                    expect(Math.abs(menuCoords.right - buttonCoords.right + menuMargin)).toBeLessThanOrEqual(1);

                    done();
                });
        });

        function loadPopupAndWaitUntilInitialized(currentTabUrl: string = "") {
            return Canvas.loadPage("popup", null)
                // wait for html to load
                .then(() => {
                    Canvas.init({});
                    return waitUntil(() => chrome.tabs.query.spy.calls.count() > 0)
                })
                // wait for initialization
                .then(() => {
                    // this will execute last step of initialization which includes initialization on VM plugins
                    chrome.tabs.query.fireCallbacksFromAllCalls([chrome.mocks.getTab(1, currentTabUrl)]);
                });
        }
    });
}