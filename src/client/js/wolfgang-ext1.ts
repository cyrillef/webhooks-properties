//
// Copyright (c) Autodesk, Inc. All rights reserved
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM 'AS IS' AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//

class MyExtension1 extends Autodesk.Viewing.Extension {

	private rootNode: Autodesk.Viewing.BubbleNode = null;
	private currentNode: Autodesk.Viewing.BubbleNode = null;
	private panel: Autodesk.Viewing.UI.DockingPanel = null;

	constructor(viewer: Autodesk.Viewing.GuiViewer3D, options: any) {
		super(viewer, options);

		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_UNLOADED_EVENT, this.onExtensionPreUnloaded.bind(this));
	}

	public load(): boolean | Promise<boolean> {
		console.log('MyExtension1Panel has been loaded');
		this.viewer.setEnvMapBackground(null); // Hide background environment if there is one
		//this.viewer.setBackgroundColor(0, 64, 128); // Set background color
		return (true);
	}

	public unload(): boolean {
		console.log('MyExtension1Panel has been unloaded');
		// Wolfgang option #1
		this.panel.uninitialize(); // deletes the DOM elements
		delete this.panel; // deletes the javascript object
		this.panel = null; // not really needed, but...
		return (true);
	}

	public onToolbarCreated(toolbar?: Autodesk.Viewing.UI.ToolBar): void {

	}

	public loadNextModel(viewerConfig: any, loadOptions: any): void {
		if (!this.currentNode)
			return;
		//this.viewer.loadDocumentNode(this.rootNode.getDocument(), nextNode, loadOptions);
	}

	public onExtensionPreUnloaded(extensionInfo: ExtensionInfo): void {
		if (extensionInfo.extensionId === 'Autodesk.MyExtension1' && this.panel) {
			// time to cleanup
			//this.panel.setVisible(false);
			// Wolfgang option #2
			// this.panel.uninitialize(); // deletes the DOM elements
			// delete this.panel; // deletes the javascript object
			// this.panel = null; // not really needed, but...
		}
	}

	public getPanel(): void {
		if (!this.panel)
			this.panel = new MyExtension1Panel(
				this.viewer.container as HTMLElement,
				'MyExtension1Panel',
				'My Extension1 Panel',
				{
					addFooter: true,
				}
			);
		this.panel.setVisible(!this.panel.isVisible());
	}

}

class MyExtension1Panel extends Autodesk.Viewing.UI.DockingPanel {

	private titleBar: HTMLElement;
	private closeButton: HTMLElement;

	constructor(parentContainer: HTMLElement, id: string, title: string, options?: Autodesk.Viewing.UI.DockingPanelOptions) {
		super(parentContainer, id, title, options);
	}

	public initialize(): void {
		super.initialize();
		this.initializeMoveHandlers(this.container);

		this.container.classList.add('docking-panel-container-solid-color-a');
		this.container.style.top = "10px";
		this.container.style.left = "10px";
		this.container.style.width = "auto";
		this.container.style.height = "auto";
		this.container.style.resize = "auto";

		this.createScrollContainer();

		const div = document.createElement('div');
		div.style.margin = '20px';
		div.innerText = "My content here";
		//this.container.appendChild(div);
		this.scrollContainer.appendChild(div);
	}

	public uninitialize(): void {
		super.uninitialize();
	}

}

Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.MyExtension1', MyExtension1);