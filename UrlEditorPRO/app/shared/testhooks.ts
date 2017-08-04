module UrlEditor {
    let activeFeatures: string[] = [];
    let breakOnDebugCall = false;

    export function debug(featureNames: string | string[], ...params: any[]) {
        if (typeof featureNames == "string") {
            featureNames = [featureNames];
        }

        if (featureNames.some(item => activeFeatures.indexOf(item) != -1)) {
            debugger;
            console.log(featureNames, params[0]);
        }
    }

    export function turnOnDebugging(features: string | string[], breakOnDebug = undefined) {
        if (typeof features == "string") {
            features = [features];
        }

        if (breakOnDebug != undefined) {
            breakOnDebugCall = breakOnDebug;
        }

        activeFeatures = activeFeatures.concat(features);
    }
}