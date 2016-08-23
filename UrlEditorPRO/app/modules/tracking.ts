declare var _gaq: Array<Array<string | number>>;

module UrlEditor.Tracking {

    export enum Category {
        AddParam,
        RemoveParam,
        Navigate,
        Encoding,
        AutoSuggest,
        Settings,
        Submit,
        Sort
    }

    export class Dimension {
        public static Version = "dimension1";
    }

    var enableLogOncePerSession = true;
    var trackingEnabled = true;
    var logOncePerSession: IMap<boolean> = {};

    // create global analytics object
    (function internalInit(hostObject, propertyName) {
        hostObject['GoogleAnalyticsObject'] = propertyName;
        hostObject[propertyName] = hostObject[propertyName] || function () {
            (hostObject[propertyName].q = hostObject[propertyName].q || []).push(arguments)
        };
        hostObject[propertyName].l = 1 * <any>new Date();
    })(window, 'ga');

    // initial tracking variavles setup
    ga('create', 'UA-81916828-1', 'auto');
    ga('set', 'checkProtocolTask', null); // Disables file protocol checking.

    export function init(_trackingEnabled: boolean) {
        trackingEnabled = _trackingEnabled;

        if (!trackingEnabled) {
            return;
        }

        // load Analytics library
        var a = document.createElement("script");
        a.async = true;
        a.src = "https://www.google-analytics.com/analytics.js";
        var m = document.getElementsByTagName("script")[0];
        m.parentNode.insertBefore(a, m);

        ga('send', 'pageview');
    }

    export function setCustomDimension(name: string, value: string) {
        ga('set', name, value);
    }

    export function trackEvent(category: Category, action: string, label?: string, value?: string | number) {
        if (!trackingEnabled) {
            return;
        }

        // check if we should log this event
        if (!isLoggingEnabled(Array.prototype.slice.call(arguments))) {
            return;
        }
        
        ga('send', 'event', Category[category], action, label, value);
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