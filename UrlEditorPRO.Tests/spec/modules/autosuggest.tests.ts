/// <reference path="../helpers/canvas.ts" />
/// <reference path="../helpers/helpers.ts" />
/// <reference path="../../../UrlEditorPRO/app/shared/interfaces.shared.d.ts" />
/// <reference path="../../../UrlEditorPRO/app/modules/autosuggest.ts" />

module Tests.Autosuggest {

    const Elements = Canvas.PopupElements;

    describe("Autosuggest test validating if", () => {

        let autoSuggestData: UrlEditor.IAutoSuggestData;

        let chrome: ChromeMock;

        beforeEach(done => {
            autoSuggestData = {
                "www.google.com": {
                    "param1": ["param1_val1", "param1_val2"],
                    "param2": ["param2_val1", "param2_val2"]
                }
            }

            Canvas.create();
            Canvas.loadPage("popup", null /* prevent from initialization */);
            chrome = createChromeMock(Canvas.getWindow(), "chrome");

            // make sure that DOM is ready
            waitUntil(() => Canvas.ready).then(() => done());
        });

        it("suggestions list appears on param name element", (done) => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            let nameInput = paramContainer.getNameElem();
            Canvas.type(nameInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            // wait for position adjustments
            setTimeout(() => {
                expect(suggestions.isVisible()).toBeTruthy();
                expect(suggestions.isBelow(paramContainer.getNameElem())).toBeTruthy();
                expect(suggestions.getSuggestionTexts()).toEqual(["param1", "param2"]);

                done();
            }, 0);
        });

        it("suggestions list appears on param name element - domain alias", (done ) => {
            // add alias domain
            autoSuggestData["www.google-test.com"] = {
                "[suggestionAlias]": ["www.google.com"]
            };

            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            let tab = chrome.mocks.getTab();
            tab.url = "http://www.google-test.com/path?q=r&z=x"
            chrome.tabs.getSelected.fireCallbacks(tab);

            let paramContainer = new ParamContainer(0);
            let nameInput = paramContainer.getNameElem();
            Canvas.type(nameInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            // wait for position adjustments
            setTimeout(() => {
                expect(suggestions.isVisible()).toBeTruthy();
                expect(suggestions.isBelow(paramContainer.getNameElem())).toBeTruthy();
                expect(suggestions.getSuggestionTexts()).toEqual(["param1", "param2"]);

                done();
            }, 0);
        });

        it("suggestions list appears on param value element", (done) => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            // it has to match param name
            paramContainer.getNameElem().value = "param1";

            let valueInput = paramContainer.getValueElem();
            Canvas.type(valueInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            // wait for position adjustments
            setTimeout(() => {
                expect(suggestions.isVisible()).toBeTruthy();
                expect(suggestions.isBelow(paramContainer.getValueElem())).toBeTruthy();
                expect(suggestions.getSuggestionTexts()).toEqual(["param1_val1", "param1_val2"]);

                done();
            }, 0);
        });

        it("suggestions list appears on param value element - domain alias", (done) => {
            // add alias domain
            autoSuggestData["www.google-test.com"] = {
                "[suggestionAlias]": ["www.google.com"]
            };

            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            let tab = chrome.mocks.getTab();
            tab.url = "http://www.google-test.com/path?q=r&z=x"
            chrome.tabs.getSelected.fireCallbacks(tab);

            let paramContainer = new ParamContainer(0);
            // it has to match param name
            paramContainer.getNameElem().value = "param1";

            let valueInput = paramContainer.getValueElem();
            Canvas.type(valueInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            // wait for position adjustments
            setTimeout(() => {
                expect(suggestions.isVisible()).toBeTruthy();
                expect(suggestions.isBelow(paramContainer.getValueElem())).toBeTruthy();
                expect(suggestions.getSuggestionTexts()).toEqual(["param1_val1", "param1_val2"]);

                done();
            }, 0);
        });

        it("submitting param name suggescion causes jump to value field and new suggestions are shown", (done) => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            // it has to match param name
            let nameInput = paramContainer.getNameElem();
            Canvas.type(nameInput, "{backspace}pa");

            let valueInput = paramContainer.getValueElem();
            valueInput.value = "p"; // set it to be a prefix for existing value suggestions

            let suggestions = new SuggestionContainer();

            // wait for position adjustments
            setTimeout(() => {
                expect(suggestions.isVisible()).toBeTruthy();

                // select first suggestion
                Canvas.keyboardCombination(nameInput, "down-arrow");

                waitUntil(() => nameInput.value == "param1").then(() => {
                    Canvas.keyboardCombination(nameInput, "enter");

                    // wait for position adjustments
                    setTimeout(() => {
                        expect(suggestions.isVisible()).toBeTruthy();
                        expect(suggestions.getSuggestionTexts()).toEqual(["param1_val1", "param1_val2"]);
                        done();
                    }, 0);
                });
            }, 0);
        });

        it("new param is added to suggestion data", (done) => {
            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramNameElem = new ParamContainer(0).getNameElem();
            // add new param keyboard combination (ctrl+"+")
            $(paramNameElem).simulate("key-combo", { combo: "ctrl+=" });

            let lastParamContainer = ParamContainer.getLast();
            Canvas.type(lastParamContainer.getNameElem(), "new_param");
            Canvas.type(lastParamContainer.getValueElem(), "new_value");

            waitUntil(() => Elements.getFullUrl().textContent.endsWith("new_value"))
                .then(() => {
                    Elements.getGoButton().simulateClick();

                    // create expected data object
                    autoSuggestData["www.google.com"]["new_param"] = ["new_value"];

                    detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
                    done();
                });
        });

        it("new param is added to suggestion data - domain alias", (done) => {
            // add alias domain
            autoSuggestData["www.google-test.com"] = {
                "[suggestionAlias]": ["www.google.com"]
            };

            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            // pass current tab info
            let tab = chrome.mocks.getTab();
            tab.url = "http://www.google-test.com/path?q=r&z=x"
            chrome.tabs.getSelected.fireCallbacks(tab);

            let paramNameElem = new ParamContainer(0).getNameElem();
            // add new param keyboard combination (ctrl+"+")
            $(paramNameElem).simulate("key-combo", { combo: "ctrl+=" });

            let lastParamContainer = ParamContainer.getLast();
            Canvas.type(lastParamContainer.getNameElem(), "new_param");
            Canvas.type(lastParamContainer.getValueElem(), "new_value");

            waitUntil(() => Elements.getFullUrl().textContent.endsWith("new_value"))
                .then(() => {
                    Canvas.click(Elements.getGoButton());

                    // create expected data object
                    autoSuggestData["www.google.com"]["new_param"] = ["new_value"];

                    detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
                    done();
                });
        });

        it("new param value is added to suggestion data when param data exists already", () => {
            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            paramContainer.getNameElem().value = "param1";
            let valueElem = paramContainer.getValueElem();
            valueElem.value = "";
            Canvas.type(valueElem, "new_value")

            Canvas.click(Elements.getGoButton());

            // create expected data object
            autoSuggestData["www.google.com"]["param1"].unshift("new_value");

            detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
        });

        it("new param is added to suggestion data when domain data didin't exist before", (done) => {
            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            // pass current tab info
            let tab = chrome.mocks.getTab();
            tab.url = "http://www.something-new.com/path?q=r&z=x"
            chrome.tabs.getSelected.fireCallbacks(tab);

            let paramNameElem = new ParamContainer(0).getNameElem();
            // add new param keyboard combination (ctrl+"+")
            $(paramNameElem).simulate("key-combo", { combo: "ctrl+=" });

            let lastParamContainer = ParamContainer.getLast();
            Canvas.type(lastParamContainer.getNameElem(), "new_param");
            Canvas.type(lastParamContainer.getValueElem(), "new_value");

            waitUntil(() => Elements.getFullUrl().textContent.endsWith("new_value"))
                .then(() => {
                    Canvas.click(Elements.getGoButton());

                    // create expected data object
                    autoSuggestData["www.something-new.com"] = {
                        "new_param": ["new_value"]
                    };

                    detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
                    done();
                });
        });

        it("new param is added to suggestion data when suggestion data didn't exist before", (done) => {
            // no autosuggest data
            let storage = <any>{ trackingEnabled: false };
            Canvas.init(storage);

            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            Elements.getAddParamButton().simulateClick();

            let lastParamContainer = ParamContainer.getLast();
            Canvas.type(lastParamContainer.getNameElem(), "new_param");
            Canvas.type(lastParamContainer.getValueElem(), "new_value");

            waitUntil(() => Elements.getFullUrl().textContent.endsWith("new_value"))
                .then(() => {
                    Elements.getGoButton().simulateClick();

                    let expected = {
                        "www.google.com": {
                            "new_param": ["new_value"]
                        }
                    };

                    detailedObjectComparison(expected, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
                    done();
                });
        });

        all("clicking on delete button removes param", [[false], [true]], (testDomainAlias: boolean) => {
            if (testDomainAlias) {
                // add new alias to the data
                autoSuggestData["www.alias.com"] = {
                    "[suggestionAlias]": ["www.google.com"]
                };
            }

            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            let tab = chrome.mocks.getTab();
            if (testDomainAlias) {
                tab.url = "http://www.alias.com?x=1&y=2";
            }

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(tab);

            let paramContainer = new ParamContainer(0);
            let nameInput = paramContainer.getNameElem();
            Canvas.type(nameInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            suggestions.clickDeleteButton("param1");

            // update expected data object
            delete autoSuggestData["www.google.com"]["param1"];

            detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
        });

        all("clicking on delete button removes param value (is domain alias cases)", [[false], [true]], (testDomainAlias: boolean) => {
            if (testDomainAlias) {
                // add new alias to the data
                autoSuggestData["www.alias.com"] = {
                    "[suggestionAlias]": ["www.google.com"]
                };
            }

            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            let tab = chrome.mocks.getTab();
            if (testDomainAlias) {
                tab.url = "http://www.alias.com?x=1&y=2";
            }

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(tab);

            let paramContainer = new ParamContainer(0);
            paramContainer.getNameElem().value = "param1";
            let valueInput = paramContainer.getValueElem();
            Canvas.type(valueInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            suggestions.clickDeleteButton("param1_val1");

            // update expected data object (remove first param value)
            autoSuggestData["www.google.com"]["param1"].shift();

            detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
        });

        it("delete via keyboard combination (ctrl+d) removes param", (done) => {
            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            let nameInput = paramContainer.getNameElem();
            Canvas.type(nameInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            // select first suggestion
            Canvas.keyboardCombination(nameInput, "down-arrow");

            waitUntil(() => nameInput.value == "param1").then(() => {
                expect(nameInput.value).toEqual("param1");
                // delete via keyboard combination
                Canvas.keyboardCombination(nameInput, "ctrl+d");

                expect(nameInput.value).toEqual("pa");

                // update expected data object
                delete autoSuggestData["www.google.com"]["param1"];

                detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
                done();
            });
        });

        it("deleteting all param value suggestions removes param name suggestion, domain (when it's empty) and all bind domains", () => {
            // leave only one param
            delete autoSuggestData["www.google.com"]["param2"];
            autoSuggestData["www.binddomain.com"] = {
                "[suggestionAlias]": ["www.google.com"]
            };
            autoSuggestData["www.regular-domain.com"] = {
                "param_reg1": ["reg1", "reg2"]
            }
            autoSuggestData["www.binddomain2.com"] = {
                "[suggestionAlias]": ["www.google.com"]
            };
            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            paramContainer.getNameElem().value = "param1";
            let valueInput = paramContainer.getValueElem();
            Canvas.type(valueInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            suggestions.clickDeleteButton("param1_val1");
            suggestions.clickDeleteButton("param1_val2");

            // update expected data object (remove first param value)
            delete autoSuggestData["www.google.com"];
            delete autoSuggestData["www.binddomain.com"];
            delete autoSuggestData["www.binddomain2.com"];

            detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
        });

        it("deleteting last param name suggestion from one domain removes domain and all bind domains", () => {
            // leave only one param
            delete autoSuggestData["www.google.com"]["param2"];
            autoSuggestData["www.binddomain.com"] = {
                "[suggestionAlias]": ["www.google.com"]
            };
            autoSuggestData["www.regular-domain.com"] = {
                "param_reg1": ["reg1", "reg2"]
            }
            autoSuggestData["www.binddomain2.com"] = {
                "[suggestionAlias]": ["www.google.com"]
            };
            let storage = { autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false };
            Canvas.init(storage);

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            Canvas.type(paramContainer.getNameElem(), "{backspace}pa");

            let suggestions = new SuggestionContainer();

            suggestions.clickDeleteButton("param1");

            // update expected data object (remove first param value)
            delete autoSuggestData["www.google.com"];
            delete autoSuggestData["www.binddomain.com"];
            delete autoSuggestData["www.binddomain2.com"];

            detailedObjectComparison(autoSuggestData, JSON.parse(storage.autoSuggestData), "autoSuggestData", true/*exactMatch*/);
        });
    });

    class ParamContainer {
        private container: HTMLElement;
        constructor(private index: number) {
            this.container = Canvas.getElementById("params");
        }

        getNameElem() {
            return <HTMLInputElement>this.container.querySelector(`.param:nth-of-type(${this.index + 1}) input:nth-of-type(1)`);
        }

        getValueElem() {
            return <HTMLInputElement>this.container.querySelector(`.param:nth-of-type(${this.index + 1}) input:nth-of-type(2)`);
        }

        static getLast() {
            // we could use last-of-type selector but this way we wouldn't be able to reuse constructor
            return new ParamContainer(Canvas.getElementById("params").children.length - 1);
        }
    }

    class SuggestionContainer {
        private container: HTMLElement;
        constructor() {
            this.container = <HTMLElement>Canvas.getElementBySelector(".suggestions");
        }

        isVisible() {
            return this.container.style.display != "none";
        }

        isBelow(inputElem: HTMLElement) {
            let inputElemRect = inputElem.getBoundingClientRect();
            let containerRect = this.container.getBoundingClientRect();

            let expected = {
                top: inputElemRect.bottom - 3, // should be moved by few pixels
                right: inputElemRect.right,
                left: inputElemRect.left
            }

            // filter object to propertiec which we want to validate (skipping "bottom")
            let actual: IMap<number> = {};
            Object.keys(expected).forEach(property => {
                actual[property] = containerRect[property];
            });

            let result = JSON.stringify(expected) == JSON.stringify(actual);
            if (!result) {
                console.error("Suggestions container shown in the wrong place [actual/expected]", actual, expected);
            }

            return result;
        }

        getSuggestionTexts() {
            return this.getSuggestionsElems().map(li => {
                return li.childNodes[0].textContent;
            })
        }

        clickDeleteButton(suggestion: string) {
            let deleteButton: HTMLElement;
            this.getSuggestionsElems().forEach(elem => {
                if (elem.childNodes[0].textContent == suggestion) {
                    Canvas.click(<HTMLElement>elem.childNodes[1]);
                }
            });
        }

        private getSuggestionsElems() {
            let suggestions = this.container.querySelectorAll(".suggestion");
            if (suggestions.length == 0) {
                throw new Error("Suggestions not found");
            }

            return Array.from(suggestions);
        }
    }
}