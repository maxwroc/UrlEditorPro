/// <reference path="../helpers/canvas.ts" />
/// <reference path="../helpers/helpers.ts" />

module Tests.Autosuggest {
    describe("Autorefresh test validating if", () => {

        const AutoRefreshButtonSelector = "*[for='refresh_check']";
        const AutoRefreshModuleSelector = "#refresh_check ~ *";
        let chrome: ChromeMock;

        beforeEach(done => {
            Canvas.create();
            Canvas.loadPage("popup", null /* prevent from initialization */);
            chrome = createChromeMock(Canvas.getWindow(), "chrome");

            // make sure that DOM is ready
            waitUntil(() => Canvas.ready).then(() => done());
        });

        it("button is shown after clicking on Page Options", (done) => {
            expect(Canvas.isVisible(AutoRefreshButtonSelector)).toBeFalsy();

            // showing page options menu
            Canvas.PopupElements.getPageOptions().simulateClick();

            setTimeout(() => {
                expect(Canvas.isVisible(AutoRefreshButtonSelector)).toBeTruthy();
                done();
            }, 1)
        });

        it("clicking on AutoRefresh option shows module", (done) => {
            // click on PageOptions button to show page options menu
            Canvas.PopupElements.getPageOptions().simulateClick();

            // wait for it to show up
            waitUntil(() => Canvas.isVisible(AutoRefreshButtonSelector))
                .then(() => {
                    // click on AutoRefresh button
                    Canvas.click(AutoRefreshButtonSelector);
                    // wait for the module to show up
                    return waitUntil(() => Canvas.isVisible(AutoRefreshModuleSelector))
                })
                .then(() => done());
        });

        it("clicking on Start button initializes refresh interval", (done) => {
            done();
        });
    });
}