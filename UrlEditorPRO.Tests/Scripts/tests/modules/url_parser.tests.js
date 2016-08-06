/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../../../urleditorpro/app/modules/url_parser.ts" />
describe("Uri class", function () {
    it("parses simple url correctly", function () {
        var uri = new UrlEditor.Uri("http://somedomain.com:85/search?param=1&test=zonk#page_section");
        expect(uri.protocol()).toEqual("http:");
        expect(uri.host()).toEqual("somedomain.com:85");
        expect(uri.hostname()).toEqual("somedomain.com");
        expect(uri.pathname()).toEqual("/search");
        expect(uri.query()).toEqual("?param=1&test=zonk");
        expect(uri.hash()).toEqual("#page_section");
        expect(uri.params()["param"]).toEqual("1");
    });
});
