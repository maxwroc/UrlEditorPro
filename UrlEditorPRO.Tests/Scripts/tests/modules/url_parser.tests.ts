/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../../../urleditorpro/app/modules/url_parser.ts" />

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
});