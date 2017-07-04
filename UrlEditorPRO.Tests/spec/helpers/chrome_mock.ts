((chrome_obj: IMap<any>) => {
    if (chrome_obj) {
        return;
    }

    chrome_obj = {};
    chrome_obj.runtime = <IMap<any>>{};
    chrome_obj.runtime.getManifest = () => <Object>{ "version": "1.0.2" };

})(window["chrome"]);