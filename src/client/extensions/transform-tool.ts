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

class TransformTool {

	private viewer: Autodesk.Viewing.GuiViewer3D = null;
	private options: any = null;

	private _hitPoint: THREE.Vector3 = null;
	private _isDragging: boolean = false;
	private _transformMesh: THREE.Mesh = null;
	private _modifiedFragIdMap: any = {};
	private _selectedFragProxyMap: any = {};
	private _transformControlTx: THREE.TransformControls = null;

	constructor(viewer: Autodesk.Viewing.GuiViewer3D, options?: any) {
		this.viewer = viewer;
		this.options = options;
	}

	public getNames(): string[] {
		return (['Dotty.Viewing.Tool.TransformTool']);
	}

	public getName(): string {
		return ('Dotty.Viewing.Tool.TransformTool');
	}

	public activate(): void {
		this.viewer.select([]);
		const bbox: THREE.Box3 = this.viewer.model.getBoundingBox();

		this.viewer.impl.createOverlayScene('Dotty.Viewing.Tool.TransformTool');
		this._transformControlTx = new THREE.TransformControls(
			this.viewer.impl.camera,
			this.viewer.impl.canvas
		);
		this._transformControlTx.setSize(bbox.getBoundingSphere(null).radius * 5);
		this._transformControlTx.visible = false;
		this.viewer.impl.addOverlay('Dotty.Viewing.Tool.TransformTool', this._transformControlTx);
		this._transformMesh = this.createTransformMesh();
		this._transformControlTx.attach(this._transformMesh);
		this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onItemSelected.bind(this));
	}

	public deactivate(): void {
		this.viewer.impl.removeOverlay('Dotty.Viewing.Tool.TransformTool', this._transformControlTx);
		this._transformControlTx.removeEventListener('change', this.onTxChange);
		this._transformControlTx = null;
		this.viewer.impl.removeOverlayScene('Dotty.Viewing.Tool.TransformTool');
		this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChanged);
		this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onItemSelected);
	}

	protected update(t: any): boolean {
		return (false);
	}

	protected onItemSelected(event: any) {
		this._selectedFragProxyMap = {};
		if (!event.fragIdsArray.length) {
			this._hitPoint = null;
			this._transformControlTx.visible = false;
			this._transformControlTx.removeEventListener('change', this.onTxChange);
			this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChanged);
			return;
		}
		if (this._hitPoint) {
			this._transformControlTx.visible = true;
			this._transformControlTx.position = this._hitPoint;
			this._transformControlTx.addEventListener('change', this.onTxChange.bind(this));
			this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChanged.bind(this));
			event.fragIdsArray.forEach((fragId: number): void => {
				const fragProxy: any = this.viewer.impl.getFragmentProxy(this.viewer.model, fragId);
				fragProxy.getAnimTransform();
				const offset: any = {
					x: this._hitPoint.x - fragProxy.position.x,
					y: this._hitPoint.y - fragProxy.position.y,
					z: this._hitPoint.z - fragProxy.position.z
				};
				fragProxy.offset = offset;
				this._selectedFragProxyMap[fragId] = fragProxy;
				this._modifiedFragIdMap[fragId] = {};
			});
			this._hitPoint = null;
		} else {
			this._transformControlTx.visible = false;
		}
	}

	protected onTxChange(): void {
		for (let fragId in this._selectedFragProxyMap) {
			const fragProxy: any = this._selectedFragProxyMap[fragId];
			const position: THREE.Vector3 = new THREE.Vector3(
				this._transformMesh.position.x - fragProxy.offset.x,
				this._transformMesh.position.y - fragProxy.offset.y,
				this._transformMesh.position.z - fragProxy.offset.z
			);
			fragProxy.position = position;
			fragProxy.updateAnimTransform();
		}
		this.viewer.impl.sceneUpdated(true);
	}

	protected onCameraChanged(): void {
		this._transformControlTx.update();
	}

	protected handleSingleClick(event: any, button: any): boolean {
		return (false);
	}

	protected handleDoubleClick(event: any, button: any): boolean {
		return (false);
	}

	protected handleSingleTap(event: any): boolean {
		return (false);
	}

	protected handleDoubleTap(event: any): boolean {
		return (false);
	}

	protected handleKeyDown(event: any, keyCode: any): boolean {
		return (false);
	}

	protected handleKeyUp(event: any, keyCode: any): boolean {
		return (false);
	}

	protected handleWheelInput(delta: number): boolean {
		return (false);
	}

	protected handleButtonDown(event: any, button: any): boolean {
		this._hitPoint = this.getHitPoint(event);
		this._isDragging = true;
		if ((this._transformControlTx as any).onPointerDown(event))
			return (true);
		//return (this._transRotControl.onPointerDown(event));
		return (false);
	}

	protected handleButtonUp(event: any, button: any): boolean {
		this._isDragging = false;
		if ((this._transformControlTx as any).onPointerUp(event))
			return (true);
		//return (this._transRotControl.onPointerUp(event));
		return (false);
	}

	protected handleMouseMove(event: any): boolean {
		if (this._isDragging) {
			if ((this._transformControlTx as any).onPointerMove(event))
				return (true);
			return (false);
		}
		if ((this._transformControlTx as any).onPointerHover(event))
			return (true);
		//return (this._transRotControl.onPointerHover(event));
		return (false);
	}

	protected handleGesture(event: any): boolean {
		return (false);
	}

	protected handleBlur(event: any): boolean {
		return (false);
	}

	protected handleResize(): boolean {
		return (false);
	}

	protected getHitPoint(event: any): THREE.Vector3 {
		let screenPoint: THREE.Vector2 = new THREE.Vector2(event.clientX, event.clientY);
		screenPoint = this.normalize(screenPoint);
		const hitPoint: THREE.Vector3 = this.viewer.utilities.getHitPoint(screenPoint.x, screenPoint.y);
		return (hitPoint);
	}

	protected normalize(screenPoint: THREE.Vector2): THREE.Vector2 {
		const viewport = this.viewer.navigation.getScreenViewport();
		return (new THREE.Vector2(
			(screenPoint.x - viewport.left) / viewport.width,
			(screenPoint.y - viewport.top) / viewport.height
		));
	}

	protected getTransformMap(): void {
		const transformMap: any = {};
		for (let fragId in this._modifiedFragIdMap) {
			let fragProxy = this.viewer.impl.getFragmentProxy(this.viewer.model, Number.parseInt(fragId));
			fragProxy.getAnimTransform();
			transformMap[fragId] = {
				position: fragProxy.position
			};
			fragProxy = null;
		}
		return (transformMap);
	}

	public static guid(): string {
		let d: number = new Date().getTime();
		const guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
			/[xy]/g,
			(c) => {
				const r: number = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return ((c == 'x' ? r : (r & 0x7 | 0x8)).toString(16));
			}
		);
		return (guid);
	}

	// Creates a dummy mesh to attach control to
	protected createTransformMesh(): THREE.Mesh {
		const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
		this.viewer.impl.matman().addMaterial(TransformTool.guid(), material, true);

		const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.0001, 5), material);
		sphere.position.set(0, 0, 0);

		return (sphere);
	}

}

class TransformExtension extends Autodesk.Viewing.Extension {

	private tool: TransformTool = null;
	private toolactivated: boolean = false;
	private _group: any = null;
	private _button: any = null;

	constructor(viewer: Autodesk.Viewing.GuiViewer3D, options?: any) {
		super(viewer, options);
	}

	public load(): boolean {
		return (true);
	}

	public unload(): boolean {
		if (this.tool)
			this.viewer.toolController.deactivateTool(this.tool.getName());
		// Clean our UI elements if we added any
		if (this._group) {
			this._group.removeControl(this._button);
			if (this._group.getNumberOfControls() === 0)
				this.viewer.toolbar.removeControl(this._group);
		}
		return (true);
	}

	protected initialize(): void {
		this.tool = new TransformTool(this.viewer, this.options);
		this.viewer.toolController.registerTool(this.tool);
		if (this.viewer.model.getInstanceTree())
			this.customize();
		else
			this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.customize.bind(this));
	}

	protected customize(): void {
		this.viewer.toolController.activateTool(this.tool.getName());
	}

	public onToolbarCreated() {
		// Create a new toolbar group if it doesn't exist
		this._group = this.viewer.toolbar.getControl('transformExtensionsToolbar');
		if (!this._group) {
			this._group = new Autodesk.Viewing.UI.ControlGroup('transformExtensionsToolbar');
			this.viewer.toolbar.addControl(this._group);
		}

		// Add a new button to the toolbar group
		this._button = new Autodesk.Viewing.UI.Button('transformExtensionButton');
		this._button.onClick = (ev: any): void => {
			// Execute an action here
			if (!this.toolactivated) {
				this.initialize();
				this.toolactivated = true;
			} else {
				this.viewer.toolController.deactivateTool(this.tool.getName());
				this.toolactivated = false;
			}
		};
		this._button.setToolTip('Transform Extension');
		this._button.addClass('transformextensionicon');
		this._group.addControl(this._button);
	}

}

Autodesk.Viewing.AutodeskNamespace('Autodesk.ADN.Viewing.Extensions');
Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.ADN.Viewing.Extensions.TransformTool', TransformTool);
