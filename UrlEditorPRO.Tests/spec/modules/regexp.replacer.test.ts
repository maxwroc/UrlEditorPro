/// <reference path="../../../UrlEditorPRO/app/modules/regexp.replacer.ts" />

module Tests {
    describe("RegExpGroupReplacer", () => {
        all("returns correct result",
            [
                ["test string to replace sth", ".*(string)", ["rrr"], "test rrr to replace sth"],
                ["test string to replace sth", "(.*)(string)", ["val", " rest"], "val rest to replace sth"],
                ["test string to replace sth string", "(string)", ["val"], "test val to replace sth val"],
                ["test (string) to replace sth", ".*(\\(string\\))", ["val"], "test val to replace sth"],
                ["test string to replace sth string", ".*sth.*(string)", ["val"], "test string to replace sth val"],
                ["test string to replace sth string", ".*(string).*(sth)", ["val", "val2"], "test val to replace val2 string"]
            ],
            (subject: string, pattern, values: string[], result: string) => {
                expect((new UrlEditor.RegExpGroupReplacer(pattern)).replace(subject, values)).toEqual(result);
            }
        );
    });
}