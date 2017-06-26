

module Tests {
    describe("[Options] Suggestions - testing if ", () => {

        beforeEach(() => {
            let pageElem = createElement<HTMLSelectElement>("select", "autoSuggestPages");
            let paramElem = createElement<HTMLSelectElement>("select", "autoSuggestParams");
            let bindToElem = createElement<HTMLSelectElement>("select", "autoSuggestPageToBind");
            let paramValuesContainer = createElement<HTMLDivElement>("div", "autoSuggestParamValues");
            let recentlyUsedParamsModule = createElement("select", "recentlyUsedParamsModule");
            spyOn(UrlEditor.Helpers, "ge").and.callFake((id: string) => {

            });
        });

        it("ddd", () => {
            spyOn(UrlEditor.Options, "bindOnInitializedHandler");
        });
    });
}