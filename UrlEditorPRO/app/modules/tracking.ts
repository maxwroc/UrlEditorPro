

module UrlEditor.Tracking {

    export enum Category {
        AddParam,
        RemoveParam,
        Navigate,
        Encoding,
        AutoSuggest
    }

    var logOncePerSession: IMap<boolean> = {};

    export function init() {
        (function (i, s, o, g, r, a?, m?) {
        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * <any>(new Date()); a = s.createElement(o),
            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
        })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

        ga('create', 'UA-81916828-1', 'auto');
        ga('set', 'checkProtocolTask', null);
        ga('send', 'pageview');
    }

    export function trackEvent(category: Category, action: string, label?: string, value?: number) {

        var fields: IFieldsObject = {
            eventCategory: Category[category],
            eventAction: action
        }

        if (typeof label != "undefined") {
            fields.eventLabel = label;
        }
        if (typeof value != "undefined") {
            fields.eventValue = value;
        }

        // check if we should log this event
        if (!isLoggingEnabled(fields)) {
            return;
        }

        ga("send", "event", fields);
    }

    function isLoggingEnabled(fields: IFieldsObject): boolean {

        var hash = JSON.stringify(fields);

        if (logOncePerSession[hash]) {
            return false;
        }

        logOncePerSession[hash] = true;

        return true;
    }

    function hashCode(s: string) {
        return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    }

    interface IFieldsObject {
        eventCategory: string,
        eventAction: string,
        eventLabel?: string,
        eventValue?: number,
        nonInteraction?: boolean
    }
}