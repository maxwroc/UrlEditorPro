module UrlParser {

    interface IAutoSuggestData {
        [pageHostName: string]: IAutoSuggestPageData;
    }

    interface IAutoSuggestPageData {
        [paramName: string]: string[]
    }

    export class AutoSuggest {

        private settings: Settings;

        private parsedData: IAutoSuggestData;

        constructor(settings: Settings, doc: Document) {
            this.settings = settings;

            // bind event handlers
        }

        showSuggestions(elem: HTMLInputElement): void {
            // check if auto-suggest functionality is enabled
            if (!this.settings.autoSuggest) {
                return;
            }

            // parse the data if it wasn't already
            if (this.parsedData == undefined) {
                this.parsedData = JSON.parse(this.settings.autoSuggestData);
            }
        }
    }
}