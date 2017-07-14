/// <reference path="../helpers/canvas.ts" />

//declare var waitUntil: (escapeOn: () => boolean) => { then: (executeAfter: Function) => void };

module Tests.Autosuggest {

    describe("test", () => {
        it("test", done => {
            Canvas.create();
            Canvas.loadPage("popup", true, new UrlEditor.Settings({ trackingEnabled: false }));
            let chromeMock = Canvas.chromeMock;

            waitUntil(() => Canvas.ready)
                .then(() => {
                    chromeMock.tabs.getSelected.fireCallbacks(chromeMock.mocks.getTab());
                    done();
                });
        });
    });





}