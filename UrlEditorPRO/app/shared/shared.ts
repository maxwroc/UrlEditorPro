
module UrlEditor.Plugins {
    export const ViewModel: IViewModelPlugin[] = [];
    export const Background: IBackgroundPluginConstructor[] = [];


    interface IViewModelPlugin2 {
        new(settings: Settings, viewModel: ViewModel): void;
    }

    interface IBackgroundPluginConstructor {
        (settings: Settings, background: IPageBackground): void;
    }

    export interface IViewModelPlugin {
        // ... rest ...
    }

    declare var IViewModelPlugin: {
        new (settings: Settings, viewModel: IViewModel): IViewModelPlugin;
    }

    let zzz: IViewModelPlugin;
    let cc = new zzz("asdasd");
}