module UrlEditor.ParamOptions {
    let clickAction = "clickAction";

    let doc: Document;
    let menuElem: IParamOptionsContainer;
    let paramContainer: IParamContainerElement;
    let deleteParam: (paramContainer: IParamContainerElement) => void;
    let updateFullUrl: () => void;

    export function init(
        _doc: Document,
        deleteParamAction: (paramContainer: IParamContainerElement) => void,
        updateFullUrlAction: () => void) {
        doc = _doc;
        deleteParam = deleteParamAction;
        updateFullUrl = () => {
            setTimeout(() => {
                paramContainer.valueElement.focus();
                updateFullUrlAction();
            }, 0);
        }

        _doc.body.addEventListener("keydown", evt => isVisible() && handleKeyboard(evt), true);
    }

    export function show(paramContainerElem: IParamContainerElement, pressedButton: HTMLElement, openingByKeyboard = false) {


        // update local variable required by event handline
        paramContainer = paramContainerElem;

        if (!menuElem) {
            initializeContainer();
        }

        menuElem.urlEncodeElem.checked = paramContainer.urlEncoded;
        menuElem.base64EncodeElem.checked = paramContainer.base64Encoded;

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

    function initializeContainer() {
        // for some reason TS compiler doesn't like such cast in case of UL elements
        menuElem = doc.createElement("ul");
        menuElem.setAttribute("id", "paramMenu");
        menuElem.innerHTML = `
                    <li id="param_urlEncode">
                        <label><input type="checkbox" name="param_urlEncode" /><span>Url encode</span></label>
                    </li>
                    <li id="param_base64Encode">
                        <label><input type="checkbox" name="param_base64Encode" /><span>Base64 encode</span></label>
                    </li>
                    <li id="param_delete">
                        <input type="button" value="Delete" name="param_delete" />
                    </li>
                `;

        menuElem.addEventListener("click", evt => {

            evt.stopPropagation();

            // There is additional click event triggered for the checkbox - when it state changes.
            if (!isVisible()) {
                return;
            }

            let elem = <HTMLElement>evt.target;
            while (!elem[clickAction] && elem != menuElem) {
                elem = elem.parentElement;
            }

            elem[clickAction] && elem[clickAction]();

            hide();
        }, true);

        let options = menuElem.getElementsByTagName("li");
        for (let i = 0, option: HTMLLIElement; option = <HTMLLIElement>options[i]; i++) {
            switch (option.id) {
                case "param_urlEncode":
                    option[clickAction] = () => {
                        paramContainer.urlEncoded = !paramContainer.urlEncoded;
                        paramContainer.base64Encoded = paramContainer.base64Encoded ? !paramContainer.urlEncoded : false;
                        updateFullUrl();
                    }
                    menuElem.urlEncodeElem = option.getElementsByTagName("input")[0];
                    break;
                case "param_base64Encode":
                    option[clickAction] = () => {
                        paramContainer.base64Encoded = !paramContainer.base64Encoded;
                        paramContainer.urlEncoded = paramContainer.urlEncoded ? !paramContainer.base64Encoded : false;
                        updateFullUrl();
                    }
                    menuElem.base64EncodeElem = option.getElementsByTagName("input")[0];
                    break;
                case "param_delete":
                    option[clickAction] = () => deleteParam(paramContainer);
                    break;
            }
        }

        
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
                    selectedOption[clickAction] && selectedOption[clickAction]();
                }
                hide();
                evt.preventDefault();
                break;
            case 27: // esc
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
}