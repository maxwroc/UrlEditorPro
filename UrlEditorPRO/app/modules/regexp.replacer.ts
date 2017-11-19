module UrlEditor {
    /**
     * Replaces RegExp groups from given pattern with given values.
     *
     * @example
     *      (new RegExpGroupReplacer(".*#.*(test)")).replace("replace test after # this test should be replaced", ["string"])
     *      => "replace test after # this string should be replaced"
     */
    export class RegExpGroupReplacer {

        private resultIndexes: number[] = [];
        private patternConverted: string;

        public groupsCount = 0;
        private groupsCountAfterConversion = 0;

        private rulePattern = /(\(.*?[^\\]\))/g;

        constructor(private pattern: string) {
            this.addRemaningPatternGroups();
        }

        /**
         * Replaces matched groups with custom values
         * @param subject String in which values will be replaced
         * @param replaceValues Values to insert or delegate
         */
        replace(subject: string, replaceValues: string[] | IReplaceValueGetter): string {
            if (typeof replaceValues == "function") {
                return this.replaceAndConvert(subject, replaceValues as IReplaceValueGetter)
            }

            return this.replaceMatchedWithValues(subject, replaceValues);
        }

        /**
         * Replaces matched groups with given values
         * @param subject String in which values will be replaced
         * @param replaceValues Values to insert
         */
        private replaceMatchedWithValues(subject: string, values: string[]) {
            return subject.replace(new RegExp(this.patternConverted, "g"), this.getReplaceString(values));
        }

        /**
         * Replaces matched groups with values returned by deleagte
         * @param subject Replaces matched groups with the result of delegate call
         * @param converter Delegate to get value to insert
         */
        private replaceAndConvert(subject: string, converter: IReplaceValueGetter): string {
            let results: string[] = [];
            let match = subject.match(this.pattern);
            for (let i = 1; i < match.length; i++) {
                results.push(converter(match[i], i - 1));
            }

            return this.replace(subject, results);
        }

        /**
         * Builds replace-value string (e.g. $1replaced$2)
         * @param newSubstrings Values to insert
         */
        private getReplaceString(newSubstrings: string[]): string {
            let result = "";
            for (let i = 1; i <= this.groupsCountAfterConversion; i++) {
                let index = this.resultIndexes.indexOf(i - 1);
                result += index != -1 ? newSubstrings[index] : "$" + i;
            }

            return result;
        }

        /**
         * Since we need to capture all parts of original string we need to add remaining groups.
         *
         * @example ".*#.*(test).*something" => "(.*#.*)(test)(.*something)"
         */
        private addRemaningPatternGroups() {
            let groups = [];
            let index = 0;
            this.pattern.replace(this.rulePattern, (match, captured, i) => {
              let everythingBefore = this.pattern.substr(index, i - index);
              if (everythingBefore) {
                groups.push("(" + everythingBefore + ")")
              }

              this.resultIndexes.push(groups.length);
              groups.push(captured);

              index = i + captured.length;
              this.groupsCount++;

              return match;
            });

            if (index < this.pattern.length) {
              groups.push(this.pattern.substr(index));
            }

            this.groupsCountAfterConversion = groups.length;

            this.patternConverted = groups.join("");
        }
    }

    export interface IReplaceValueGetter {
        (val: string, index: number): string
    }
}