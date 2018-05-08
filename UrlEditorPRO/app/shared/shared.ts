
module UrlEditor.Plugins {
    export const ViewModel: IViewModelPluginConstructor[] = [];
    export const Background: IBackgroundPluginConstructor[] = [];


    export interface IViewModelPluginConstructor {
        new (settings: Settings, viewModel: ViewModel): IPlugin;
    }

    export interface IBackgroundPluginConstructor {
        new (settings: Settings, background: IPageBackground): IPlugin;
    }

    export interface IPlugin {
        // placeholder
    }
}