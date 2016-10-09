/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../helpers/helpers.ts" />
/// <reference path="../../../../urleditorpro/app/modules/url_parser.ts" />

module Tests {
    describe("Uri class", () => {
        it("parses simple url", () => {
            var uri = new UrlEditor.Uri("http://somedomain.com:85/search?param=1&test=zonk#page_section");

            expect(uri.protocol()).toEqual("http:");
            expect(uri.host()).toEqual("somedomain.com:85");
            expect(uri.hostname()).toEqual("somedomain.com");
            expect(uri.pathname()).toEqual("/search");
            expect(uri.query()).toEqual("?param=1&test=zonk");
            expect(uri.hash()).toEqual("#page_section");
            expect(uri.params()["param"]).toEqual(["1"]);
        });

        it("parses url witch contains params with empty values", () => {
            var uri = new UrlEditor.Uri("http://somedomain.com/?param_empty1=&param=test1&param_empty2=");

            expect(uri.params()["param_empty1"]).toEqual([""]);
            expect(uri.params()["param_empty2"]).toEqual([""]);
        });

        it("parses url witch contains params with same names", () => {
            var uri = new UrlEditor.Uri("http://somedomain.com/?param=test1&param=test2&someother_param=test");

            expect(uri.params()["param"]).toEqual(["test1", "test2"]);
            expect(uri.params()["someother_param"]).toEqual(["test"]);
        });

        it("sets url with params with same names", () => {
            var uri = new UrlEditor.Uri("http://something/?d=1&d=2");

            var newParams: IMap<string[]> = {
                "d": ["3", "4"]
            };

            uri.params(newParams);

            expect(uri.params()).toEqual(newParams);
            expect(uri.url()).toEqual("http://something/?d=3&d=4");
        });

        all("gets hit-highlighted param when calling getHighlightedUrl",
            [
                // host
                ["|http://something/dddd?param1=1&param2=val2&param3=t", "<strong>http://something</strong>/dddd?param1=1&param2=val2&param3=t"],
                ["htt|p://something/dddd?param1=1&param2=val2&param3=t", "<strong>http://something</strong>/dddd?param1=1&param2=val2&param3=t"],
                ["http:/|/something/dddd?param1=1&param2=val2&param3=t", "<strong>http://something</strong>/dddd?param1=1&param2=val2&param3=t"],
                ["http://something|/dddd?param1=1&param2=val2&param3=t", "<strong>http://something</strong>/dddd?param1=1&param2=val2&param3=t"],
                ["http://somethin|g/dddd?param1=1&param2=val2&param3=t", "<strong>http://something</strong>/dddd?param1=1&param2=val2&param3=t"],
                // path
                ["http://something/|dddd/r?param1=1&param2=val2&param3=t", "http://something<strong>/dddd/r</strong>?param1=1&param2=val2&param3=t"],
                ["http://something/dddd|/r?param1=1&param2=val2&param3=t", "http://something<strong>/dddd/r</strong>?param1=1&param2=val2&param3=t"],
                ["http://something/dddd/r|?param1=1&param2=val2&param3=t", "http://something<strong>/dddd/r</strong>?param1=1&param2=val2&param3=t"],
                // params
                ["http://something/dddd?param1=1&param|2=val2&param3=t", "http://something/dddd?param1=1&<strong>param2</strong>=<strong class=\"second\">val2</strong>&param3=t"],
                ["http://something/dddd?param1=1&param2=|val2&param3=t", "http://something/dddd?param1=1&<strong>param2</strong>=<strong class=\"second\">val2</strong>&param3=t"],
                ["http://something/dddd?param1=1&param2=val2|&param3=t", "http://something/dddd?param1=1&<strong>param2</strong>=<strong class=\"second\">val2</strong>&param3=t"],
                ["http://something/dddd?param1=1&|param2=val2&param3=t", "http://something/dddd?param1=1&<strong>param2</strong>=<strong class=\"second\">val2</strong>&param3=t"],
                ["http://something/dddd?param1=1&param2=val2&param3=t|", "http://something/dddd?param1=1&param2=val2&<strong>param3</strong>=<strong class=\"second\">t</strong>"],
                ["http://something/dddd?|param1=1&param2=val2&param3=t", "http://something/dddd?<strong>param1</strong>=<strong class=\"second\">1</strong>&param2=val2&param3=t"],
            ],
            (url: string, expected: string) => {
            var uri = new UrlEditor.Uri(url.replace("|", ""));

            var result = uri.getHighlightedUrl(url.indexOf("|"));
            expect(result).toEqual(expected);
        });
    });
}