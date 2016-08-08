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
            Category[Category["Settings"] = 5] = "Settings";
            Category[Category["Submit"] = 6] = "Submit";
            Category[Category["Sort"] = 7] = "Sort";
        })(Tracking.Category || (Tracking.Category = {}));
        var Category = Tracking.Category;
        _gaq = window["_gaq"] = window["_gaq"] || [];
        _gaq.push(['_setAccount', 'UA-81916828-1']);
        _gaq.push(['_trackPageview']);
        var enableLogOncePerSession = true;
        var logOncePerSession = {};
        function init() {
            var ga = document.createElement('script');
            ga.type = 'text/javascript';
            ga.async = true;
            ga.src = 'https://ssl.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(ga, s);
        }
        Tracking.init = init;
        function trackEvent(category, action, label, value) {
            var eventData = ["_trackEvent", Category[category], action];
            addOptionalEventParam(eventData, label);
            addOptionalEventParam(eventData, value);
            // check if we should log this event
            if (!isLoggingEnabled(eventData)) {
                return;
            }
            _gaq.push(eventData);
        }
        Tracking.trackEvent = trackEvent;
        function addOptionalEventParam(eventData, param) {
            if (typeof param != "undefined") {
                eventData.push(param);
            }
        }
        function isLoggingEnabled(params) {
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
        function hashCode(s) {
            return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
        }
    })(Tracking = UrlEditor.Tracking || (UrlEditor.Tracking = {}));
})(UrlEditor || (UrlEditor = {}));
