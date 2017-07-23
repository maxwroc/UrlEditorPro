/// <reference path="../helpers/canvas.ts" />

module Tests.Autosuggest {

    describe("Autosuggest test validating if", () => {

        let autoSuggestData: UrlEditor.IAutoSuggestData = {
            "www.google.com": {
                "param1": ["param1_val1", "param1_val2"]
            }
        }

        let chrome: ChromeMock;

        beforeEach(done => {
            Canvas.create();
            Canvas.loadPage("popup", null /* prevent from initialization */);
            chrome = createChromeMock(Canvas.getWindow(), "chrome");

            // make sure that DOM is ready
            waitUntil(() => Canvas.ready).then(() => done());
        })

        it("suggestions list appears on param name element", () => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            let nameInput = paramContainer.getNameElem();
            Canvas.type(nameInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();

            expect(suggestions.isVisible()).toBeTruthy();
            expect(suggestions.isBelow(paramContainer.getNameElem())).toBeTruthy();
            expect(suggestions.getSuggestionTexts()).toEqual(["param1"]);
        });

        it("suggestions list appears on param value element", () => {
            Canvas.init({ autoSuggestData: JSON.stringify(autoSuggestData), trackingEnabled: false });

            // pass current tab info
            chrome.tabs.getSelected.fireCallbacks(chrome.mocks.getTab());

            let paramContainer = new ParamContainer(0);
            // it has to match param name
            paramContainer.getNameElem().value = "param1";

            let valueInput = paramContainer.getValueElem();
            Canvas.type(valueInput, "{backspace}pa");

            let suggestions = new SuggestionContainer();
            expect(suggestions.isVisible()).toBeTruthy();
            expect(suggestions.isBelow(paramContainer.getValueElem())).toBeTruthy();
            expect(suggestions.getSuggestionTexts()).toEqual(["param1_val1", "param1_val2"]);
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
            let suggestions = this.container.querySelectorAll(".suggestion");
            if (suggestions.length == 0) {
                throw new Error("Suggestions not found");
            }

            return Array.from(suggestions).map(li => {
                return li.childNodes[0].textContent;
            })
        }
    }


}