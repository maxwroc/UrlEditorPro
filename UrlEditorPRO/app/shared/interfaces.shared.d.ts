
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