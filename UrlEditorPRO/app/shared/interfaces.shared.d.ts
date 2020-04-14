
interface IMap<T> {
    [key: string]: T
}
interface IStringMap {
    [key: string]: string
}

interface IParsedUrl {
    protocol: string;   // => "http:"
    hostname: string;   // => "example.com"
    port: number;       // => "3000"
    pathname: string;   // => "/pathname/"
    query: string;      // => "?search=test"
    hash: string;       // => "#hash"
    host: string;       // => "example.com:3000"
    params: IStringMap;
}

interface IParamContainerElement extends HTMLDivElement {
    nameElement?: HTMLInputElement;
    valueElement?: HTMLInputElement;
    isParamContainer?: boolean;
    urlEncoded?: boolean;
    base64Encoded?: boolean;
    isFlippable?: boolean;
    hasJumpedToValueOnce?: boolean;
}

interface IBindOnBeforeRequestHandler {
    (filter: string, name: string, callback: (redirData: chrome.webRequest.WebRequestBodyDetails) => chrome.webRequest.BlockingResponse, extraInfoSpec: string[]): void;
}

interface IRedirectionRuleData extends IRuleData{
    protocol?: string,
    hostname?: string,
    port?: number,
    path?: string,
    paramsToUpdate?: IMap<string>,
    strReplace?: string[][];
}

interface IRegExpRuleData extends IRuleData {
    regExp: string,
    isRegExpGlobal: boolean,
    replaceString?: string,
    replaceValues?: IGroupReplaceValue[]
}

interface IGroupReplaceValue {
    func: string,
    val: string
}

interface IRuleData {
    name: string,
    urlFilter: string,
    isAutomatic?: boolean,
    hotKey?: string,
    disabledReason?: string
}

interface IBackgroundPageEventMap {
    "tabChange": (tabId: number) => void,
    "tabNavigate": (tabId: number, url: string) => void,
}

interface ContextMenuProperties extends chrome.contextMenus.CreateProperties {
    isEnabled?: (tab: chrome.tabs.Tab) => boolean
}

interface IPageBackground {
    /**
     * Adds event listener.
     * @param name Event name.
     * @param handler Evend callback function.
     */
    addEventListener<N extends keyof IBackgroundPageEventMap>(name: N, handler: IBackgroundPageEventMap[N]);

    /**
     * Registers new context menu item.
     * @param props Context menu item properties.
     */
    addActionContextMenuItem(properties: IContextMenuItemProperties);

    /**
    * Returns active/enabled action-contextmenu items.
    * @param tab Tab for which context menu items should be returned.
    * @param group Context menu items group.
    */
    getActiveActionContextMenuItems(tab: chrome.tabs.Tab, group: string): ContextMenuProperties[];

    /**
     * Unregisters context menu item or group.
     * @param group Context menu item group.
     * @param label Context menu item label.
     * @param tabId Context menu item tab id.
     */
    removeActionContextMenuItem(group: string, label?: string, tabId?: number);
}

interface IContextMenuItemProperties {
    group: string;
    label: string;
    clickHandler: (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => void;
    tabId?: number;
    isEnabled?: (tab: chrome.tabs.Tab) => boolean;
}

interface IViewModel {

}
