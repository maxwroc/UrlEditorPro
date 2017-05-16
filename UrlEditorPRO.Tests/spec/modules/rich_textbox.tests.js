/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../helpers/helpers.ts" />
/// <reference path="../../../urleditorpro/app/modules/rich_textbox.ts" />
var Tests;
(function (Tests) {
    describe("Rich textbox test validating if", function () {
        var rtb;
        var elem;
        beforeEach(function () {
            elem = document.createElement("div");
            elem.textContent = "http://something.com/path?param1=value1";
            rtb = new UrlEditor.RichTextBox(elem);
        });
        it("RichTextBox highlights sigle part of the element text", function () {
            rtb.highlight([[7, 20]]);
            expect(elem.innerHTML).toEqual("http://<b>something.com</b>/path?param1=value1");
        });
        it("RichTextBox highlights multiple parts of the element text", function () {
            rtb.highlight([[7, 20], [26, 32]]);
            expect(elem.innerHTML).toEqual("http://<b>something.com</b>/path?<b>param1</b>=value1");
        });
        it("RichTextBox highlight clears previous highlight", function () {
            elem.innerHTML = "http://<b>something.com</b>/path?param1=value1";
            rtb.highlight([[33, 39]]);
            expect(elem.innerHTML).toEqual("http://something.com/path?param1=<b>value1</b>");
        });
        it("RichTextBox highlight encodes properly highlighted text", function () {
            elem.textContent = "http://something.com/path?param1=value1<>&param2=<>'\")(*&^%$#@&param3=<>";
            rtb.highlight([[49, 63]]);
            expect(elem.innerHTML).toEqual("http://something.com/path?param1=value1&lt;&gt;&amp;param2=<b>&lt;&gt;'\")(*&amp;^%$#@&amp;</b>param3=&lt;&gt;");
        });
    });
})(Tests || (Tests = {}));
//# sourceMappingURL=rich_textbox.tests.js.map