/// <reference path="../shared/interfaces.shared.d.ts" />

module UrlEditor.ParamOptions {
    const clickAction = "clickAction";
    const setActiveState = "setActiveState";

    let doc: Document;
    let menuElem: IParamOptionsContainer;
    let paramOptions: IParamOption[] = [];

    export function init(
        _doc: Document) {
        doc = _doc;

        _doc.body.addEventListener("keydown", evt => isVisible() && handleKeyboard(evt), true);
    }

    export function registerOption(option: IParamOption) {
        paramOptions.push(option);
        paramOptions = paramOptions.sort((o1, o2) => o1.order - o2.order);
    }

    export function show(container: IParamContainerElement, pressedButton: HTMLElement, openingByKeyboard = false) {

        if (menuElem) {
            // update isActive states
            for (let i = 0; i < menuElem.children.length; i++) {
                // check if handler exists (present only on fields which supports it)
                if (menuElem.children[i][setActiveState]) {
                    menuElem.children[i][setActiveState](container);
                }
            }
        } else {
            initializeOptions(container);
        }

        menuElem.currentContainer = container;
        menuElem.style.display = "block";

        // move menu to proper position
        let pos = pressedButton.getBoundingClientRect();
        // pos doesn't contain scroll value so we need to add it
        let posTop = pos.top + window.scrollY - 8 - 2; // 8px body margin; 2px border
        menuElem.style.top = posTop + "px";
        let posRight = pos.right - menuElem.parentElement.offsetWidth + 2; // 2px for border
        menuElem.style.right = posRight + "px";

        Helpers.ensureIsVisible(menuElem, doc.body, window.innerHeight);

        // when opened by keyboard select first option
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

    function initializeOptions(container: IParamContainerElement): void {

        menuElem = doc.createElement("ul");
        menuElem.setAttribute("id", "paramMenu");

        paramOptions.forEach((option, index) => {
            let li = doc.createElement("li");
            li.id = "mpo_" + index;

            let span = doc.createElement("span");
            span.textContent = option.text;

            var isActive = option.isActive(container);
            if (isActive != undefined) {

                let label = doc.createElement("label");
                label.appendChild(span);

                let checkbox = doc.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = isActive;
                label.appendChild(checkbox);

                li.appendChild(label);

                // prepare handler for updating the field state
                li[setActiveState] = (c: IParamContainerElement) => checkbox.checked = option.isActive(c);
            }
            else {
                li.appendChild(span);
            }

            li[clickAction] = () => {
                option.action(menuElem.currentContainer);
                hide();
            }

            // using mouseup event as "click" one is triggered as well whenever input checkbox state changes (do avoid double action execution)
            li.addEventListener("mouseup", evt => {
                evt.stopPropagation();
                option.action(menuElem.currentContainer);
                hide();
            }, true);

            menuElem.appendChild(li);
        });

        doc.body.appendChild(menuElem);
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
                    selectedOption[clickAction]();
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
        currentContainer?: IParamContainerElement;
    }

    export interface IParamOption {
        text: string;
        action: (container: IParamContainerElement) => void;
        isActive: (container: IParamContainerElement) => boolean;
        order?: number;
    }
}