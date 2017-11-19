
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
    (filter: string, name: string, callback: (redirData: chrome.webRequest.WebRequestBodyDetails, force: boolean) => chrome.webRequest.BlockingResponse, extraInfoSpec: string[]): void;
}

interface IRedirectionRuleData extends IRuleData{
    protocol?: string,
    hostname?: string,
    port?: number,
    paramsToUpdate?: IMap<string>,
    strReplace?: string[][];
}

interface IRegExpRuleData extends IRuleData {
    regExp: string,
    replaceString: string,
    replaceValues: string[]
}

interface IRuleData {
    name: string,
    urlFilter: string,
    isAutomatic?: boolean;
    hotKey?: string
}