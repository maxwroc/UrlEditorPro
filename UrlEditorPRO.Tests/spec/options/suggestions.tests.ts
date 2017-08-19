/// <reference path="../helpers/helpers.ts" />
/// <reference path="../helpers/canvas.ts" />
/// <reference path="../../../UrlEditorPRO/app/modules/autosuggest.ts" />

module Tests {

    describe("[Options] Suggestions (integration) - testing if ", () => {
        const Elements = Canvas.OptionsElements.Suggestions;

        let autoSuggestData: UrlEditor.IAutoSuggestData;
        let chrome: ChromeMock;

        beforeEach(done => {

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

            Canvas.create();
            Canvas.loadPage("options", null /* prevent from initialization */);
            chrome = createChromeMock(Canvas.getWindow(), "chrome");

            // make sure that DOM is ready
            waitUntil(() => Canvas.ready).then(() => done());
        });

        it("fields are initialized with proper values", () => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            expect(Elements.getDomainList().getValueText()).toEqual("-- select domain --");
            expect(Elements.getParamList().getValueText()).toEqual("-- select domain first --");
            expect(Elements.getValueList().innerHTML.replace(/[\s\r\n]/g, "")).toEqual("");
            expect(Elements.getBindDomainList().getValueText()).toEqual("-- select domain first --");
        });

        it("pages combo box is populated", () => {

            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            let domainListSelect = Elements.getDomainList();
            let domains = Object.keys(autoSuggestData);
            expect(domainListSelect.children.length).toEqual(domains.length + 1); // one additional for placeholder "-- select ... --"

            domains.forEach((domain, index) => {
                // skip the first one (placeholder)
                index++;
                expect("OPTION").toEqual(domainListSelect.children[index].tagName);
                expect(domain).toEqual(domainListSelect.children[index]["value"]);
            });
        });

        it("params combo box is populated when page is selected", () => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            let autoSuggestPages = Elements.getDomainList();
            let autoSuggestParams = Elements.getParamList();
            autoSuggestPages.selectedIndex = 1;

            // select item and trigger change event
            autoSuggestPages.simulateSelectItem("www.google.com");

            let params = Object.keys(autoSuggestData[autoSuggestPages.value]);
            expect(autoSuggestParams.children.length).toEqual(params.length + 1); // one additional for placeholder "-- select ... --"

            params.forEach((param, index) => {
                // skip the first one (placeholder)
                index++;
                expect("OPTION").toEqual(autoSuggestParams.children[index].tagName);
                expect(param).toEqual(autoSuggestParams.children[index]["value"]);
            });
        });

        it("param values are populated when param is selected", () => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            let autoSuggestPages = Elements.getDomainList();
            let autoSuggestParams = Elements.getParamList();
            let autoSuggestParamValues = Elements.getValueList();

            autoSuggestPages.simulateSelectItem("www.google.com");

            autoSuggestParams.simulateSelectItem("param1");

            let paramValues = autoSuggestData[autoSuggestPages.value][autoSuggestParams.value];
            expect(autoSuggestParamValues.children.length).toEqual(paramValues.length);

            paramValues.forEach((val, index) => {
                expect("DIV").toEqual(autoSuggestParamValues.children[index].tagName);
                expect(val).toEqual(autoSuggestParamValues.children[index].firstElementChild["value"]);
            });
        });

        it("binding merges params and updates the data correctly", () => {
            let settings = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(settings);

            Elements.getDomainList().simulateSelectItem("www.google.com");
            Elements.getBindDomainList().simulateSelectItem("www.web.com");

            Elements.getSaveButton().simulateClick();

            let expected = {
                "www.google.com": {
                    "param1": ["a1", "a2", "a3", "a10"],
                    "param2": ["b1", "b2", "b3"],
                    "param3": ["c1"]
                },
                "www.web.com": {
                    "[suggestionAlias]": ["www.google.com2"]
                }
            }

            detailedObjectComparison(expected, JSON.parse(settings.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
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

            let settings = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(settings);

            Elements.getDomainList().simulateSelectItem("www.web.com");

            let params = Object.keys(autoSuggestData["www.google.com"]);
            let autoSuggestParams = Elements.getParamList();
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
                ["www.google.com", "[Unbind] www.web.com"],
                ["www.web.com", "[Unbind] www.google.com"]
            ],
            (subjectPage: string, targetPage: string) => {

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

                let settings = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
                Canvas.init(settings);

                Elements.getDomainList().simulateSelectItem(subjectPage);
                Elements.getBindDomainList().simulateSelectItem(targetPage);

                Elements.getSaveButton().simulateClick();

                detailedObjectComparison(expected, JSON.parse(settings.autoSuggestData), "autoSuggestData");
            });

        all("pages to bind are populated correctly",
            [
                ["www.google.com", ["-- select website to (un)bind --", "[Unbind] www.something.com", "[Unbind] www.web.com", "www.bing.com"]],
                ["www.something.com", ["-- select website to (un)bind --", "[Unbind] www.google.com"]]
            ],
            (subjectPage: string, expectedPagesToBind: string[]) => {
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
                    },
                    "www.else.com": {
                        "param1": ["test1"]
                    }
                };

                let settings = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
                Canvas.init(settings);

                Elements.getDomainList().simulateSelectItem(subjectPage);

                let autoSuggestPageToBind = Elements.getBindDomainList();
                expectedPagesToBind.forEach((val, index) => {
                    expect("OPTION").toEqual(autoSuggestPageToBind.children[index].tagName);
                    expect(val).toEqual(autoSuggestPageToBind.children[index]["value"]);
                });
            });

        it("binding checks if other pages have current page as alias", () => {
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
                "www.new-mother-page.com": {
                    "b_param1": ["bb1"]
                }
            };

            let settings = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(settings);

            Elements.getDomainList().simulateSelectItem("www.new-mother-page.com");
            Elements.getBindDomainList().simulateSelectItem("www.google.com");

            Elements.getSaveButton().simulateClick()

            let expected = {
                "www.google.com": {
                    "[suggestionAlias]": ["www.new-mother-page.com"]
                },
                "www.something.com": {
                    "[suggestionAlias]": ["www.new-mother-page.com"]
                },
                "www.web.com": {
                    "[suggestionAlias]": ["www.new-mother-page.com"]
                },
                "www.new-mother-page.com": {
                    "param1": ["a1", "a2", "a3", "a10"],
                    "param2": ["b1", "b2", "b3"],
                    "param3": ["c1"],
                    "b_param1": ["bb1"]
                }
            };

            detailedObjectComparison(expected, JSON.parse(settings.autoSuggestData), "autoSuggestData");
        });

        it("deleting mother domain unbinds children", () => {
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
                }
            };

            let settings = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(settings);

            spyOn(Canvas.getWindow()["UrlEditor"].Options.Suggestions, "confirmWrapper").and.returnValue(true);

            Elements.getDomainList().simulateSelectItem("www.google.com");
            // click Delete
            Elements.getDomainList().getButtonSimbling().simulateClick();

            let expected = {
                "www.something.com": {
                    "param1": ["a1", "a2", "a3", "a10"],
                    "param2": ["b1", "b2", "b3"],
                    "param3": ["c1"]
                },
                "www.web.com": {
                    "[suggestionAlias]": ["www.something.com"]
                }
            };

            detailedObjectComparison(expected, JSON.parse(settings.autoSuggestData), "autoSuggestData");
        });

        it("resets fields after saving", () => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            Elements.getDomainList().simulateSelectItem("www.google.com");
            Elements.getBindDomainList().simulateSelectItem("www.web.com");
            Elements.getParamList().simulateSelectItem("param1");

            Elements.getSaveButton().simulateClick();

            expect(Elements.getDomainList().value).toEqual("-- select domain --");
            expect(Elements.getBindDomainList().value).toEqual("-- select domain first --");
            expect(Elements.getParamList().value).toEqual("-- select domain first --");
        });
    });
}