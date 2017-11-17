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

        public groupsCount = 0;

        private rulePattern = /(\(.*?[^\\]\))/g;

        private placeholder = "[ph|]";
        private placeholderPattern = /d/g;

        constructor(private pattern: string) {
          this.addRemaningPatternGroups();
        }

        /**
         * Replaces
         * @param subject String in which values will be replaced
         * @param newSubStrings Values to insert
         */
        replace(subject: string, values: {val: string, convert?: string}[]): string {
          return subject.replace(new RegExp(this.pattern, "g"), this.getReplaceString(newSubStrings))
        }

        /**
         * Builds replace-value string (e.g. $1replaced$2)
         * @param newSubstrings Values to insert
         */
        private getReplaceString(newSubstrings: {val: string, convert?: string}[]): string {
          let result = "";
          for (let i = 1; i <= this.groupsCount; i++) {
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
            return match;
          });

          if (index < this.pattern.length) {
            groups.push(this.pattern.substr(index));
          }

          this.groupsCount = groups.length;

          this.pattern = groups.join("");
        }
      }
}