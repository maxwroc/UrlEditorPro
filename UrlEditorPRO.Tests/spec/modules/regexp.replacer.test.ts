/// <reference path="../../../UrlEditorPRO/app/modules/regexp.replacer.ts" />

module Tests {
    describe("RegExpGroupReplacer", () => {
        all("returns correct result when array of values passed",
            [
                ["test string to replace sth", ".*(string)", ["rrr"], "test rrr to replace sth"],
                ["test string to replace sth", "(.*)(string)", ["val", " rest"], "val rest to replace sth"],
                ["test string to replace sth string", "(string)", ["val"], "test val to replace sth val"],
                ["test (string) to replace sth", ".*(\\(string\\))", ["val"], "test val to replace sth"],
                ["test string to replace sth string", ".*sth.*(string)", ["val"], "test string to replace sth val"],
                ["test string to replace sth string", ".*(string).*(sth)", ["val", "val2"], "test val to replace val2 string"]
            ],
            (subject: string, pattern, values: string[], result: string) => {
                expect((new UrlEditor.RegExpGroupReplacer(pattern, true)).replace(subject, values)).toEqual(result);
            }
        );

        all("returns correct result when get-value delegate passed",
            [
                ["test 11 to replace sth string", ".*([0-1]+).*(sth)", (val, i) => i == 0 ? parseInt(val) + 1 : "sthelse", "test 12 to replace sthelse string"]
            ],
            (subject: string, pattern, converter: Function, result: string) => {
                expect((new UrlEditor.RegExpGroupReplacer(pattern, false)).replace(subject, converter as UrlEditor.IReplaceValueGetter)).toEqual(result);
            }
        );
    });
}