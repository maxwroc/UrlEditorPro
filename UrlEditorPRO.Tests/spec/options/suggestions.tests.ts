/// <reference path="../../../UrlEditorPro/app/modules/shared_interfaces.d.ts" />
/// <reference path="../../../UrlEditorPro/app/modules/autosuggest.ts" />

module Tests {
    describe("[Options] Suggestions - testing if ", () => {

        let autoSuggestData: UrlEditor.IAutoSuggestData;
        let initialize: Function;

        beforeEach(() => {
            let pageElem = createElement<HTMLSelectElement>("select", "autoSuggestPages");
            let paramElem = createElement<HTMLSelectElement>("select", "autoSuggestParams");
            let bindToElem = createElement<HTMLSelectElement>("select", "autoSuggestPageToBind");
            let paramValuesContainer = createElement<HTMLDivElement>("div", "autoSuggestParamValues");
            let recentlyUsedParamsModule = createElement("select", "recentlyUsedParamsModule");
            spyOn(UrlEditor.Helpers, "ge").and.callFake((id: string) => {

            });

            
            spyOn(UrlEditor.Options, "bindOnInitializedHandler").and.callFake((init: Function) => initialize = init);
        });

        it("ddd", () => {
        });
    });
}