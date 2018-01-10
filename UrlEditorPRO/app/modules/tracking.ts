/// <reference path="../../../typings/index.d.ts" />
/// <reference path="helpers.ts" />

module UrlEditor.Tracking {

    export enum Category {
        AddParam,
        RemoveParam,
        Navigate,
        Encoding,
        AutoSuggest,
        Settings,
        Submit,
        Sort,
        Redirect
    }

    export class Dimension {
        public static Version = "dimension1";
    }

    var enableLogOncePerSession = true;
    var trackingEnabled = true;
    var logOncePerSession: IMap<boolean> = {};

    // create global analytics object
    (function internalInit(hostObject, propertyName) {
        hostObject["GoogleAnalyticsObject"] = propertyName;
        hostObject[propertyName] = hostObject[propertyName] || function () {
            (hostObject[propertyName].q = hostObject[propertyName].q || []).push(arguments)
        };
        hostObject[propertyName].l = 1 * <any>new Date();
    })(window, "ga");

    // initial tracking variavles setup
    ga("create", "UA-81916828-1", "auto");
    ga("set", "checkProtocolTask", null); // Disables file protocol checking.

    export function init(_trackingEnabled: boolean, page: string, logEventsOnce = true) {
        trackingEnabled = _trackingEnabled;
        enableLogOncePerSession = logEventsOnce;

        if (!trackingEnabled) {
            return;
        }

        // load Analytics library
        var a = document.createElement("script");
        a.async = true;
        a.src = "https://www.google-analytics.com/analytics.js";
        var m = document.getElementsByTagName("script")[0];
        m.parentNode.insertBefore(a, m);

        ga("send", "pageview", page);

        window.addEventListener("error", err => {
            let file = err.filename || "";
            // remove extension schema and id: chrome-extension://XXXXXXXXX/
            file = file.substr(Math.max(0, file.indexOf("/", 20)));
            ga("send", "exception", { "exDescription": `[${file}:${err.lineno}] ${err.message}` });
        });
    }

    export function setCustomDimension(name: string, value: string) {
        ga("set", name, value);
    }

    export function trackEvent(category: Category, action: string, label?: string, value?: string | number) {

        // check if we should log this event
        if (!isLoggingEnabled(Array.prototype.slice.call(arguments))) {
            return;
        }

        if (!trackingEnabled) {
            console.log(`TrackedEvent: ${Category[category]}/${action}/${label}/${value}`);
            return;
        }

        ga("send", "event", Category[category], action, label, value);
    }

    function addOptionalEventParam(eventData: Array<string | number>, param: string | number) {
        if (typeof param != "undefined") {
            eventData.push(param);
        }
    }

    function isLoggingEnabled(params: Array<number | string>): boolean {

        if (!enableLogOncePerSession) {
            return true;
        }

        var hash = JSON.stringify(params);

        if (logOncePerSession[hash]) {
            return false;
        }

        logOncePerSession[hash] = true;

        return true;
    }

    function hashCode(s: string) {
        return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    }
}