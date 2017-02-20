/// <reference path="shared_interfaces.d.ts" />

module UrlEditor.ParamOptions {
    let clickAction = "clickAction";

    let doc: Document;
    let menuElem: IParamOptionsContainer;
    let deleteParam: (paramContainer: IParamContainerElement) => void;
    let updateFullUrl: () => void;
    let paramOptions: IMap<IParamOptionInitialized>;

    export function init(
        _doc: Document) {
        doc = _doc;

        _doc.body.addEventListener("keydown", evt => isVisible() && handleKeyboard(evt), true);
    }

    export function registerOption(
        text: string,
        action: (container: IParamContainerElement) => void,
        isSelected: (container: IParamContainerElement) => boolean,
        order = 0) {


    }

    export function show(options: IMap<IParamOption>, pressedButton: HTMLElement, openingByKeyboard = false) {

        if (!paramOptions) {
            paramOptions = initializeOptions(options);
        }

        menuElem.style.display = "block";

        // move menu to proper position
        let pos = pressedButton.getBoundingClientRect();
        // pos doesn't contain scroll value so we need to add it
        let posTop = pos.top + doc.body.scrollTop - 8 - 2; // 8px body margin; 2px border
        menuElem.style.top = posTop + "px";
        let posRight = pos.right - menuElem.parentElement.offsetWidth + 2; // 2px for border
        menuElem.style.right = posRight + "px";

        Helpers.ensureIsVisible(menuElem, doc.body, window.innerHeight);

        if (openingByKeyboard) {
            menuElem.getElementsByTagName("li")[0].classList.add("hv");
        }
    }

    export function hide() {
        if (menuElem) {
            menuElem.style.display = "none";

            // remove selection if exists
            let slectedOption = getSelectedOption();
            slectedOption && slectedOption.classList.remove("hv");
        }
    }

    function isVisible(): boolean {
        return menuElem && menuElem.style.display != "none";
    }

    function initializeOptions(options: IMap<IParamOptionInitialized>): IMap<IParamOptionInitialized> {
        
        menuElem = doc.createElement("ul");
        menuElem.setAttribute("id", "paramMenu");

        Object.keys(options).forEach(id => {
            let li = doc.createElement("li");
            li.id = id;

            let span = doc.createElement("span");
            span.textContent = options[id].text;

            if (options[id].isActive != undefined) {

                let label = doc.createElement("label");
                label.appendChild(span);

                let checkbox = doc.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = options[id].isActive;
                label.appendChild(checkbox);

                options[id].checkboxElem = checkbox;
                li.appendChild(label);
            }
            else {
                li.appendChild(span);
            }

            li.addEventListener("click", evt => {
                evt.stopPropagation();
                options[id].action();
                hide();
            }, true);
            
            menuElem.appendChild(li);
        });

        return options;
    }

    function handleKeyboard(evt: KeyboardEvent): void {
        // we don't want this event to trigger other handlers
        evt.stopPropagation();

        switch (evt.keyCode) {
            case 38: // up
                select(-1);
                break;
            case 40: // down
                select(1);
                break;
            case 13: // enter
                let selectedOption = getSelectedOption();
                if (selectedOption != undefined) {
                    paramOptions[selectedOption.id] && paramOptions[selectedOption.id].action();
                }
                hide();
                evt.preventDefault();
                break;
            case 27: // esc
                hide();
                evt.preventDefault();
                break;
        }
    }

    function select(direction: number): void {
        let options = menuElem.getElementsByTagName("li");

        // look for currently active elem
        let activeOptionIndex = getSelectedOptionIndex(options);

        // deselect current elem
        options[activeOptionIndex].classList.remove("hv");

        // move in correct direction
        activeOptionIndex += direction;

        // make sure it not exceeds limits
        activeOptionIndex = activeOptionIndex < 0 ? options.length - 1 : activeOptionIndex >= options.length ? 0 : activeOptionIndex;

        options[activeOptionIndex].classList.add("hv");
    }

    function getSelectedOption(): HTMLLIElement {
        let options = menuElem.getElementsByTagName("li");
        let selectedOptionIndex = getSelectedOptionIndex(options, undefined);

        return selectedOptionIndex != undefined ? options[selectedOptionIndex]: undefined;
    }

    function getSelectedOptionIndex(options: NodeListOf<HTMLLIElement>, defaultIndex = 0): number {
        options = options || menuElem.getElementsByTagName("li");

        let activeOptionIndex = defaultIndex;
        for (let i = 0, option: HTMLLIElement; option = <HTMLLIElement>options[i]; i++) {
            if (option.classList.contains("hv")) {
                activeOptionIndex = i;
                break;
            }
        }

        return activeOptionIndex;
    }

    interface IParamOptionsContainer extends HTMLUListElement {
        urlEncodeElem?: HTMLInputElement;
        base64EncodeElem?: HTMLInputElement;
    }

    export interface IParamOption {
        text: string;
        action: () => void;
        isActive?: boolean;
    }

    interface IParamOptionInitialized extends IParamOption {
        checkboxElem?: HTMLInputElement;
    }
}