var UrlEditor;
(function (UrlEditor) {
    var Tracking;
    (function (Tracking) {
        (function (Category) {
            Category[Category["AddParam"] = 0] = "AddParam";
            Category[Category["RemoveParam"] = 1] = "RemoveParam";
            Category[Category["Navigate"] = 2] = "Navigate";
            Category[Category["Encoding"] = 3] = "Encoding";
            Category[Category["AutoSuggest"] = 4] = "AutoSuggest";
        })(Tracking.Category || (Tracking.Category = {}));
        var Category = Tracking.Category;
        var logOncePerSession = {};
        function init() {
            (function (i, s, o, g, r, a, m) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments);
                }, i[r].l = 1 * (new Date());
                a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m);
            })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
            ga('create', 'UA-81916828-1', 'auto');
            ga('set', 'checkProtocolTask', null);
            ga('send', 'pageview');
        }
        Tracking.init = init;
        function trackEvent(category, action, label, value) {
            var fields = {
                eventCategory: Category[category],
                eventAction: action
            };
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
        Tracking.trackEvent = trackEvent;
        function isLoggingEnabled(fields) {
            var hash = JSON.stringify(fields);
            if (logOncePerSession[hash]) {
                return false;
            }
            logOncePerSession[hash] = true;
            return true;
        }
        function hashCode(s) {
            return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
        }
    })(Tracking = UrlEditor.Tracking || (UrlEditor.Tracking = {}));
})(UrlEditor || (UrlEditor = {}));
