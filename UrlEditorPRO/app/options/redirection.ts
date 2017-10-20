
///<reference path="../shared/autosuggest.shared.ts" />

module UrlEditor.Options.Redirection {
    let settings: Settings;
    
    export function init(setts: Settings) {
        settings = setts;
        let redirectionsModule = Helpers.ge("redirectionsModule");
        redirectionsModule.addEventListener("click", handleClick)
    }

    function handleClick() {
        
    }
}