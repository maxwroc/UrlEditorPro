/// <reference path="../../../UrlEditorPro/app/modules/shared_interfaces.d.ts" />
/// <reference path="../../../UrlEditorPro/app/modules/autosuggest.ts" />
/// <reference path="../../../UrlEditorPro/app/options/suggestions.ts" />

module Tests {

    describe("[Options] Suggestions - testing if ", () => {

        let autoSuggestData: UrlEditor.IAutoSuggestData;
        let initialize: Function;
        let testPageContainer: HTMLIFrameElement;
        let pageElements: IMap<HTMLElement> = {};
        let settings: UrlEditor.Settings;

        beforeEach(() => {

            testPageContainer = createElement<HTMLIFrameElement>("iframe");
            document.body.appendChild(testPageContainer);

            let pageElementsData = {
                "autoSuggestPages": { tagName: "select", name: "page" },
                "autoSuggestParams": { tagName: "select", name: "param" },
                "autoSuggestPageToBind": { tagName: "select" },
                "autoSuggestParamValues": { tagName: "div" },
                "saveBinding": { tagName: "input", type: "button", name: "saveBinding" }
            }

            let moduleContainer = createElement("div", "recentlyUsedParamsModule");
            pageElements["recentlyUsedParamsModule"] = moduleContainer;

            Object.keys(pageElementsData).forEach(id => {
                // overwrite tag name with actual element
                pageElements[id] = createElement(pageElementsData[id]["tagName"], id);
                Object.keys(pageElementsData[id]).forEach(prop => {
                    if (prop != "tagName") {
                        pageElements[id].setAttribute(prop, pageElementsData[id][prop])
                    }
                })
                moduleContainer.appendChild(pageElements[id]);
            });

            testPageContainer.contentWindow.document.body.appendChild(moduleContainer);

            // handle get element by id calls
            spyOn(UrlEditor.Helpers, "ge").and.callFake((id: string) => pageElements[id]);

            // default autosuggest data object
            autoSuggestData = {
                "www.google.com": {
                    "param1": ["a1", "a2"],
                    "param2": ["b1", "b2", "b3"]
                },
                "www.web.com": {
                    "param1": ["a1", "a3", "a10"],
                    "param3": ["c1"]
                }
            }

            initialize = () => {
                settings = new UrlEditor.Settings({
                    autoSuggestData: JSON.stringify(autoSuggestData)
                })
                UrlEditor.Options.Suggestions.init(settings);
            }
        });

        afterEach(() => {
            document.body.removeChild(testPageContainer);
        })

        it("pages combo box is populated", () => {
            initialize();

            let autoSuggestPages = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPages");
            let pages = Object.keys(autoSuggestData);
            expect(autoSuggestPages.children.length).toEqual(pages.length + 1); // one additional for placeholder "-- select ... --"

            pages.forEach((page, index) => {
                // skip the first one (placeholder)
                index++;
                expect("OPTION").toEqual(autoSuggestPages.children[index].tagName);
                expect(page).toEqual(autoSuggestPages.children[index]["value"]);
            });
        });

        it("params combo box is populated when page is selected", () => {
            initialize();

            let autoSuggestPages = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPages");
            let autoSuggestParams = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestParams");
            autoSuggestPages.selectedIndex = 1;

            autoSuggestPages.selectedIndex = 1;
            raiseEvent(autoSuggestPages, "change");

            let params = Object.keys(autoSuggestData[autoSuggestPages.value]);
            expect(autoSuggestParams.children.length).toEqual(params.length + 1); // one additional for placeholder "-- select ... --"

            params.forEach((param, index) => {
                // skip the first one (placeholder)
                index++;
                expect("OPTION").toEqual(autoSuggestParams.children[index].tagName);
                expect(param).toEqual(autoSuggestParams.children[index]["value"]);
            });


            spyOn(UrlEditor.Options, "bindOnInitializedHandler").and.callFake((init: Function) => initialize = init);
        });

        it("param values are populated when param is selected", () => {
            initialize();

            let autoSuggestPages = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPages");
            let autoSuggestParams = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestParams");
            let autoSuggestParamValues = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestParamValues");

            autoSuggestPages.selectedIndex = 1;
            raiseEvent(autoSuggestPages, "change");

            autoSuggestParams.selectedIndex = 1;
            raiseEvent(autoSuggestParams, "change");

            let paramValues = autoSuggestData[autoSuggestPages.value][autoSuggestParams.value];
            expect(autoSuggestParamValues.children.length).toEqual(paramValues.length);

            paramValues.forEach((val, index) => {
                expect("DIV").toEqual(autoSuggestParamValues.children[index].tagName);
                expect(val).toEqual(autoSuggestParamValues.children[index].firstElementChild["value"]);
            });
        });

        it("binding merges params and updates the data correctly", () => {

            initialize();

            let setValueSettingsSpy = spyOn(settings, "setValue");

            let autoSuggestPages = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPages");
            autoSuggestPages.selectedIndex = 1; // www.google.com
            raiseEvent(autoSuggestPages, "change");

            let autoSuggestPageToBind = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPageToBind");
            autoSuggestPageToBind.selectedIndex = 1; // www.web.com
            raiseEvent(autoSuggestPageToBind, "change");

            let saveBinding = UrlEditor.Helpers.ge<HTMLSelectElement>("saveBinding");
            raiseEvent(saveBinding, "click");

            let expected = {
                "www.google.com": {
                    "param1": ["a1", "a2", "a3", "a10"],
                    "param2": ["b1", "b2", "b3"],
                    "param3": ["c1"]
                },
                "www.web.com": {
                    "[suggestionAlias]": ["www.google.com"]
                }
            }

            let actualAutoSuggestData = setValueSettingsSpy.calls.argsFor(0)[1];
            expect(actualAutoSuggestData).not.toBeUndefined();
            detailedObjectComparison(expected, JSON.parse(actualAutoSuggestData), "autoSuggestData")
        });

        it("params are listed correctly for bind page", () => {
            autoSuggestData = {
                "www.google.com": {
                    "param1": ["a1", "a2", "a3", "a10"],
                    "param2": ["b1", "b2", "b3"],
                    "param3": ["c1"]
                },
                "www.web.com": {
                    "[suggestionAlias]": ["www.google.com"]
                }
            };

            initialize();

            let autoSuggestPages = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPages");
            autoSuggestPages.selectedIndex = 2; // www.web.com
            expect(autoSuggestPages.value).toEqual("www.web.com");
            raiseEvent(autoSuggestPages, "change");

            let params = Object.keys(autoSuggestData["www.google.com"]);
            let autoSuggestParams = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestParams");
            expect(autoSuggestParams.children.length).toEqual(params.length + 1); // one additional for placeholder "-- select ... --"

            params.forEach((param, index) => {
                // skip the first one (placeholder)
                index++;
                expect("OPTION").toEqual(autoSuggestParams.children[index].tagName);
                expect(param).toEqual(autoSuggestParams.children[index]["value"]);
            });
        });

        all("params are unbind correctly",
            [
                [0, 0],
                [1, 0]
            ],
            (subjectPageIndex: number, targetPageIndex: number) => {

                autoSuggestData =
                    {
                        "www.google.com": {
                            "param1": ["a1", "a2", "a3", "a10"],
                            "param2": ["b1", "b2", "b3"],
                            "param3": ["c1"]
                        },
                        "www.web.com": {
                            "[suggestionAlias]": ["www.google.com"]
                        }
                    };

                let expected =
                    {
                        "www.google.com": {
                            "param1": ["a1", "a2", "a3", "a10"],
                            "param2": ["b1", "b2", "b3"],
                            "param3": ["c1"]
                        },
                        "www.web.com": {
                            "param1": ["a1", "a2", "a3", "a10"],
                            "param2": ["b1", "b2", "b3"],
                            "param3": ["c1"]
                        }
                    };

                initialize();

                let setValueSettingsSpy = spyOn(settings, "setValue");

                let autoSuggestPages = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPages");
                autoSuggestPages.selectedIndex = subjectPageIndex + 1; // skip default one
                expect(autoSuggestPages.value).toEqual(Object.keys(autoSuggestData)[subjectPageIndex]);
                raiseEvent(autoSuggestPages, "change");

                let autoSuggestParams = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestParams");
                let autoSuggestPageToBind = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPageToBind");
                autoSuggestPageToBind.selectedIndex = targetPageIndex + 1; // skip default one

                let saveBinding = UrlEditor.Helpers.ge<HTMLSelectElement>("saveBinding");
                raiseEvent(saveBinding, "click");

                let actualAutoSuggestData = setValueSettingsSpy.calls.argsFor(0)[1];
                expect(actualAutoSuggestData).not.toBeUndefined();
                detailedObjectComparison(expected, JSON.parse(actualAutoSuggestData), "autoSuggestData")
            });

        all("pages to bind are populated correctly",
            [
                [0 /* www.google.com */, ["-- select website to (un)bind --", "[Unbind] www.something.com", "[Unbind] www.web.com", "www.bing.com"]],
                [1 /* www.something.com */, ["-- select website to (un)bind --", "[Unbind] www.google.com"]]
            ],
            (subjectPageIndex: number, expectedPagesToBind: string[]) => {
                autoSuggestData = {
                    "www.google.com": {
                        "param1": ["a1", "a2", "a3", "a10"],
                        "param2": ["b1", "b2", "b3"],
                        "param3": ["c1"]
                    },
                    "www.something.com": {
                        "[suggestionAlias]": ["www.google.com"]
                    },
                    "www.web.com": {
                        "[suggestionAlias]": ["www.google.com"]
                    },
                    "www.bing.com": {
                        "b_param1": ["bb1"]
                    },
                    "www.bind.to.sth.else.com": {
                        "[suggestionAlias]": ["www.else.com"]
                    }
                };

                initialize();

                let autoSuggestPages = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPages");
                autoSuggestPages.selectedIndex = subjectPageIndex + 1; // skipping default one
                raiseEvent(autoSuggestPages, "change");

                let autoSuggestPageToBind = UrlEditor.Helpers.ge<HTMLSelectElement>("autoSuggestPageToBind");
                expectedPagesToBind.forEach((val, index) => {
                    expect("OPTION").toEqual(autoSuggestPageToBind.children[index].tagName);
                    expect(val).toEqual(autoSuggestPageToBind.children[index]["value"]);
                });
            });

        function raiseEvent(elem: HTMLElement, eventName: string) {
            let evt = testPageContainer.contentWindow.document.createEvent("HTMLEvents");
            evt.initEvent(eventName, true, true);
            elem.dispatchEvent(evt);
        }
    });
}