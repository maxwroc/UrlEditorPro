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

    _gaq = window["_gaq"] = window["_gaq"] || [];
    _gaq.push(['_setAccount', 'UA-81916828-1']);
    _gaq.push(['_trackPageview']);

    var enableLogOncePerSession = true;
    var trackingEnabled = true;
    var logOncePerSession: IMap<boolean> = {};

    export function init(_trackingEnabled: boolean) {
        trackingEnabled = _trackingEnabled;

        if (!trackingEnabled) {
            return;
        }

        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = 'https://ssl.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    }

    export function trackEvent(category: Category, action: string, label?: string, value?: string | number) {
        if (!trackingEnabled) {
            return;
        }

        var eventData: Array<string | number> = ["_trackEvent", Category[category], action];

        addOptionalEventParam(eventData, label);
        addOptionalEventParam(eventData, value);

        // check if we should log this event
        if (!isLoggingEnabled(eventData)) {
            return;
        }

        _gaq.push(eventData);
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