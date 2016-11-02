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

        all("gets hit-highlighted param when calling getHighlightedUrl with cursor position",
            [
                // host
                ["|http://something/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
                ["htt|p://something/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
                ["http:/|/something/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
                ["http://something|/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
                ["http://somethin|g/dddd?param1=1&param2=val2&param3=t", [[0, 16]]],
                // path
                ["http://something/|dddd/r?param1=1&param2=val2&param3=t", [[16, 23]]],
                ["http://something/dddd|/r?param1=1&param2=val2&param3=t", [[16, 23]]],
                ["http://something/dddd/r|?param1=1&param2=val2&param3=t", [[16, 23]]],
                ["http://192.168.2.104:8080/m|#/Floorplans", [[25, 27]]],
                // params
                ["http://something/dddd?param1=1&param|2=val2&param3=t", [[31, 37], [38, 42]]],
                ["http://something/dddd?param1=1&param2=|val2&param3=t", [[31, 37], [38, 42]]],
                ["http://something/dddd?param1=1&param2=val2|&param3=t", [[31, 37], [38, 42]]],
                ["http://something/dddd?param1=1&|param2=val2&param3=t", [[31, 37], [38, 42]]],
                ["http://something/dddd?param1=1&param2=val2&param3=t|", [[43, 49], [50, 51]]],
                ["http://something/dddd?|param1=1&param2=val2&param3=t", [[22, 28], [29, 30]]],
            ],
            (url: string, expected: number[][]) => {
            var uri = new UrlEditor.Uri(url.replace("|", ""));

            var result = uri.getHighlightMarkupPos(url.indexOf("|"));
            expect(result).toEqual(expected);
            });

        all("gets hit-highlighted param when calling getHighlightedUrl with param position",
            [
                ["http://something/dddd?param1=1&param2=val2&param3=t", 0, [[22, 28], [29, 30]]],
                ["http://something/dddd?param1=1&param2=val2&param3=t", 1, [[31, 37], [38, 42]]],
                ["http://something/dddd?param1=1&param2=val2&param3=t", 2, [[43, 49], [50, 51]]],
            ],
            (url: string, pos: number, expected: number[][]) => {
                var uri = new UrlEditor.Uri(url.replace("|", ""));

                var result = uri.getHighlightMarkupPos(pos, false);
                expect(result).toEqual(expected);
            });
    });
}