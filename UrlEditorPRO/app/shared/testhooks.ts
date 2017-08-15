module UrlEditor {
    let activeFeatures: DebugFeatures[] = [];
    let breakOnDebugCall = false;

    export enum DebugFeatures {
        autosuggest,
        save
    }

    export function debug(featureNames: DebugFeatures | DebugFeatures[], ...params: any[]) {
        if (typeof featureNames == "number") {
            featureNames = [featureNames];
        }

        if (featureNames.some(item => activeFeatures.indexOf(item) != -1)) {
            console.log(featureNames.map(f => DebugFeatures[f]) , params[0]);
            debugger;
        }
    }

    export function turnOnDebugging(features: DebugFeatures | DebugFeatures[], breakOnDebug = undefined) {
        if (typeof features == "number") {
            features = [features];
        }

        if (breakOnDebug != undefined) {
            breakOnDebugCall = breakOnDebug;
        }

        activeFeatures = activeFeatures.concat(features);
    }
}