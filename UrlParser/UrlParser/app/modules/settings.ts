module UrlParser {
    
    var storageCache = {};

    export class Settings {

        /**
        * Current borwser action icon
        */
        public icon = "img/edit.png";

        /**
        * Whether to hide action pane after submission
        */
        public autoHide = true;

        /**
        * Whether to show parameter suggestions
        */
        public autoSuggest = true;

        /**
        * Whether to save new parameters to suggest them in the future
        */
        public autoSuggestSaveNew = true;

        /**
        * Params suggestion data. We keep it as a string to prevent from parsing it on the initialization.
        */
        public autoSuggestData = '{}';

        constructor(storage) {
            storageCache = storage;

            Object.keys(this).forEach(key => {
                // check if property is not inherited
                if (this.hasOwnProperty(key) &&
                    // check if someone is not trying to overwrite function
                    name != "saveValue" &&
                    // check if it is defined on storage already
                    storage[key] != undefined) {
                    // all the values in WebStorage are strings if the original value is not a string it means that we need to parse
                    this[key] = typeof this[key] == "string" ? storage[key] : JSON.parse(storage[key]);
                }
            });
        }

        public setValue(name: string, value: any) {
            // check if name is valid
            if (name == "saveValue" || !this.hasOwnProperty(name)) {
                throw "Invalid setting name";
            }

            // save value in storage (note that WebStorage can only store strings
            storageCache[name] = typeof this[name] == "string" ? value : JSON.stringify(value);
            // update value in the current object
            this[name] = value;
        }
    }
}