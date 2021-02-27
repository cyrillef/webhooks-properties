/// <reference types="forge-viewer" />
declare class MyExtension1 extends Autodesk.Viewing.Extension {
    private rootNode;
    private currentNode;
    private panel;
    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options: any);
    load(): boolean | Promise<boolean>;
    unload(): boolean;
    onToolbarCreated(toolbar?: Autodesk.Viewing.UI.ToolBar): void;
    loadNextModel(viewerConfig: any, loadOptions: any): void;
    onExtensionPreUnloaded(extensionInfo: ExtensionInfo): void;
    getPanel(): void;
}
declare class MyExtension1Panel extends Autodesk.Viewing.UI.DockingPanel {
    private titleBar;
    private closeButton;
    constructor(parentContainer: HTMLElement, id: string, title: string, options?: Autodesk.Viewing.UI.DockingPanelOptions);
    initialize(): void;
    uninitialize(): void;
}
