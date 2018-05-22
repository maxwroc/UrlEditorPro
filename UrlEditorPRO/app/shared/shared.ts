/// <reference path="interfaces.shared.d.ts" />

module UrlEditor {

    export module Plugins {
        export const ViewModel: IViewModelPluginConstructor[] = [];
        export const Background: IBackgroundPluginConstructor[] = [];


        export interface IViewModelPluginConstructor {
            new (settings: Settings, viewModel: IViewModel): IPlugin;
        }

        export interface IBackgroundPluginConstructor {
            new (settings: Settings, background: IPageBackground): IPlugin;
        }

        export interface IPlugin {
            // placeholder
        }
    }

    export interface IBackgroundPlugin extends Plugins.IPlugin {
        // placeholder
    }

    export interface IViewModelPlugin extends Plugins.IPlugin {
        // placeholder
    }
}