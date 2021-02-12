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

/* TODOs
   Load models from differentt regions / different clientID / different repo BIM360 / OSS
   SVF2 socket proxy
   all events
*/

//import * as THREE from 'three';

/*export*/ type Region =
	| 'US'
	| 'EMEA';

/*export*/ type ResourceType =
	| 'svf'
	| 'svf2'
	| 'otg'
	| 'svf_local'
	| 'svf2_local'
	| 'otg_local';

interface URN_Config {
	urn: string;
	view?: Autodesk.Viewing.BubbleNodeSearchProps,
	xform?: THREE.Matrix4;
	offset?: THREE.Vector3;
	ids?: number[];
}
function isURN_Config(object: any): object is URN_Config {
	return ('urn' in object);
}

/*export*/ enum /*Autodesk.Viewing.*/SelectionType {
	MIXED = 1,
	REGULAR = 2,
	OVERLAYED = 3,
};

/**
 * Callback function used when enumerating scene objects.
 * @callback NodeCallback
 * @param {number} id Object ID.
 */
interface NodeCallback { (id: number): void };
//public NodeCallback: (id: number) => void;

/**
 * Callback function used when enumerating scene fragments.
 * @callback FragmentCallback
 * @param {number} fragId Fragment ID.
 */
interface FragmentCallback { (fragId: number): void };

/**
 * Object returned by ray casting methods for each scene object under the given canvas coordinates.
 * @typedef {object} Intersection
 * @property {number} dbId Internal ID of the scene object.
 * @property {number} distance Distance of the intersection point from camera. All intersections
 * returned by the ray casting method are sorted from the smallest distance to the largest.
 * @property {THREE.Face3} face {@link https://threejs.org/docs/#api/en/core/Face3|Face3} object
 * representing the triangular mesh face that has been intersected.
 * @property {number} faceIndex Index of the intersected face, if available.
 * @property {number} fragId ID of Forge Viewer *fragment* that was intersected.
 * @property {THREE.Vector3} intersectPoint {@link https://threejs.org/docs/#api/en/core/Vector3|Vector3} point of intersection.
 * @property {THREE.Vector3} point Same as *intersectPoint*.
 * @property {Model} model Forge Viewer {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/model|Model} that was intersected.
 */
interface Intersection {
	dbId: number;
	distance: number;
	face: THREE.Face3;
	faceIndex: number;
	fragId: number;
	intersectPoint: THREE.Vector3;
	point: THREE.Vector3;
	model: Autodesk.Viewing.Model
}

interface BasicInfo {
	target: Autodesk.Viewing.Viewer3D | Autodesk.Viewing.GuiViewer3D,
	type: string,

	[key: string]: any,
}

interface ModelLoadingInfo extends BasicInfo {
	model: Autodesk.Viewing.Model,
	isOverlay?: boolean,
	preserveTools?: any,
	svf: any,
}

interface ExtensionInfo extends BasicInfo {
	extensionId: string;
	mode?: MouseEvent;
}

interface UIToolbarDefinition {
	id?: string,
	isVertical?: boolean,
	left?: string,
	top?: string;
	bottom?: string;
	right?: string;
	docking?: string, // left, right, top, bottom

	[key: string]: any,
}

type BistateButtonOptions = boolean | { iconClass?: string[] | string[][], buttonClass?: string[] | string[][] };

interface UIButtonDefinition {
	id: string,
	iconClass?: string | string[],
	buttonClass?: string | string[],
	tooltip?: string,
	visible?: boolean,
	state?: Autodesk.Viewing.UI.Button.State,
	collapsible?: boolean,
	index?: number,

	children?: UIButtonDefinition[],
	/*
	 * bistate configuration to handle BistateButton
	 * if boolean - Auto-switch between Autodesk.Viewing.UI.Button.State.ACTIVE and Autodesk.Viewing.UI.Button.State.INACTIVE states
	 * if object, iconClass and buttonClass will switch icons and styles
	 *            can be an array of 2 strings [ '', '' ] -> 0 for Autodesk.Viewing.UI.Button.State.ACTIVE, and 1 for Autodesk.Viewing.UI.Button.State.INACTIVE
	 *            or be an array of 2 string array [ [ '', '', ... ], [ '', '', ... ] ]
	 */
	bistate?: BistateButtonOptions,

	onClick?: (event: Event) => void,
	onMouseOut?: (event: Event) => void,
	onMouseOver?: (event: Event) => void,

	onVisibiltyChanged?: (event: Event) => void,
	onStateChanged?: (event: Event) => void,
	onCollapseChanged?: (event: Event) => void,
}

interface ControlEvent {
	target: Autodesk.Viewing.UI.Control,
	type: string,

	[key: string]: any,
}

class BistateButton extends Autodesk.Viewing.UI.Button {


	private bistateOptions: BistateButtonOptions;

	constructor(id?: string, options?: Autodesk.Viewing.UI.ControlOptions) {
		super(id, options);

		this.bistateOptions = options.bistate as BistateButtonOptions;
		if ((this.bistateOptions as any).iconClass && typeof ((this.bistateOptions as any).iconClass[0]) === 'string')
			(this.bistateOptions as any).iconClass = (this.bistateOptions as any).iconClass.map((st: string): string[] => ([st]));
		if ((this.bistateOptions as any).buttonClass && typeof ((this.bistateOptions as any).buttonClass[0]) === 'string')
			(this.bistateOptions as any).buttonClass = (this.bistateOptions as any).buttonClass.map((st: string): string[] => ([st]));

		this.addEventListener('click', this.onButtonClick.bind(this));
	}

	protected onButtonClick(info: ControlEvent): void {
		const button: BistateButton = info.target as BistateButton;

		const oldState: Autodesk.Viewing.UI.Button.State = button.getState();
		button.setState(button.getState() ? Autodesk.Viewing.UI.Button.State.ACTIVE : Autodesk.Viewing.UI.Button.State.INACTIVE);
		if (typeof this.bistateOptions !== 'object')
			return;

		if (this.bistateOptions.iconClass) {
			(this.bistateOptions.iconClass[oldState] as string[]).forEach((element: string): void => (button as any).icon.classList.remove(element));
			(this.bistateOptions.iconClass[button.getState()] as string[]).forEach((element: string): void => (button as any).icon.classList.add(element));
		}
		if (this.bistateOptions.buttonClass) {
			(this.bistateOptions.buttonClass[oldState] as string[]).forEach((element: string): void => (button as any).container.classList.remove(element));
			(this.bistateOptions.buttonClass[button.getState()] as string[]).forEach((element: string): void => (button as any).container.classList.add(element));
		}
	}

}

interface UIConfiguration {
	[key: string]: UIToolbarDefinition;
}

/*export*/ type UnitType =
	| 'decimal-ft'
	| 'ft'
	| 'ft-and-decimal-in'
	| 'decimal-in'
	| 'fractional-in'
	| 'm'
	| 'cm'
	| 'mm'
	| 'm-and-cm';

interface VisualClustersExtensionOptions {
	attribName: string;
	searchAncestors: boolean;
}

interface MeasureExtensionOptions {
	units: UnitType;
	precision: number;
	//calibrationFactor?: number;
}

class LocalViewer {

	private div: HTMLElement | string;
	private urn: URN_Config[];
	private getAccessToken: Function | string;
	private region: Region;
	private endpoint: string;
	private proxy: { path: string, mode: string } = null;

	private viewer: Autodesk.Viewing.GuiViewer3D = null;
	private configuration: any = null;
	private modelBrowserExcludeRoot: boolean = true;
	private extensions: (string | { id: string, options: object })[] = null;
	private ui_definition: UIConfiguration = null;
	private ui_references: { [index: string]: Autodesk.Viewing.UI.Control | Autodesk.Viewing.UI.ToolBar } = {};

	private documents: { [index: string]: Autodesk.Viewing.Document } = {};
	private models: Autodesk.Viewing.Model[] = null;
	private startAt: Date = null;
	private darkmode: MutationObserver = null; // dark-theme, light-theme, bim-theme, acs-theme

	public static NAVTOOLBAR: string = 'navTools';
	public static MEASURETOOLBAR: string = 'measureTools';
	public static MODELTOOLBAR: string = 'modelTools';
	public static SETTINGSTOOLBAR: string = 'settingsTools';

	/**
	 * 
	 * @param div {HTMLElement|string} Point to the HTML element hosting the viewer
	 * @param urn {string|URN_Config|(string|URN_Config)[]} Base64 encoded string pointing to the resource(s) to load. All URN should come from the same region and be of the same resource type.
	 * @param getAccessToken {Function|string} Function or endpoint URL to get teh bearer token
	 * @param region {Region?} (Optional) Region in which the resource is located. Defaults to US. Possible values are US | EMEA
	 * @param endpoint {string?} (Optional) When using OTG|SVF2 with a local server, provide the endpoint to use to access the OTG|SVF2 CDN server
	 */
	constructor(div: HTMLElement | string, urn: string | URN_Config | (string | URN_Config)[], getAccessToken: Function | string, region?: Region, endpoint?: string) {
		this.div = div;
		const temp: (string | URN_Config)[] = Array.isArray(urn) ? urn : [urn];
		this.urn = temp.map((elt: string | URN_Config): any => typeof elt === 'string' ? { urn: elt } : (isURN_Config(elt) ? elt : null));
		this.urn = this.urn.filter((elt: string | URN_Config): boolean => elt !== null);
		this.getAccessToken = getAccessToken;
		this.region = region || 'US';
		this.endpoint = endpoint || '';

		// BIM360 override
		if (
			this.region === 'US' // this is the default value
			&& atob(this.urn[0].urn.replace('_', '/').replace('-', '+')).indexOf('emea') > -1
		)
			this.region = 'EMEA';
	}

	public configureExtensions(extensions: (string | { id: string, options: object })[]) {
		this.extensions = extensions;
	}

	private loadExtensions() {
		const self = this;
		this.extensions.map((elt: string | { id: string, options: object }): any => {
			if (typeof elt === 'string') {
				self.viewer.loadExtension(elt);
			} else {
				const pr = self.viewer.loadExtension(elt.id, elt.options);
				switch (elt.id) {
					case 'Autodesk.Measure': {
						pr
							.then((ext: Autodesk.Extensions.Measure.MeasureExtension): void => {
								ext.setUnits((elt.options as MeasureExtensionOptions).units);
								ext.setPrecision((elt.options as MeasureExtensionOptions).precision);
							})
							.catch((reason: any): void => { });
					}
				}
			}
		});
	}

	private reconfigureExtensions(extensionInfo?: ExtensionInfo) {
		if (extensionInfo && extensionInfo.extensionId !== 'Autodesk.Measure')
			return;
		const result = this.extensions.filter((elt: string | { id: string, options: object }): boolean => typeof elt !== 'string' && elt.id === 'Autodesk.Measure');
		if (result && result.length === 1) {
			const ext: Autodesk.Extensions.Measure.MeasureExtension = this.viewer.getExtension('Autodesk.Measure') as Autodesk.Extensions.Measure.MeasureExtension;
			if (!ext)
				return;
			const extOptions: { id: string, options: object } = result[0] as { id: string, options: object };
			//setTimeout((): void => { // Let a change to the extension code to cope with default behavior
			ext.setUnits((extOptions.options as MeasureExtensionOptions).units);
			ext.setPrecision((extOptions.options as MeasureExtensionOptions).precision);
			//}, 1000);
		}
	}

	public configureUI(ui: UIConfiguration) {
		this.ui_definition = ui;
	}

	public enableWorkersDebugging(): void {
		(Autodesk.Viewing.Private as any).ENABLE_INLINE_WORKER = false;
	}

	public setModelBrowserExcludeRoot(flag: boolean = true): void {
		this.modelBrowserExcludeRoot = flag;
	}

	public run(config: ResourceType = 'svf'): void {
		this.configuration = this.options(config);
		//Autodesk.Viewing.Private.ENABLE_INLINE_WORKER = false;
		Autodesk.Viewing.Initializer(this.configuration, this.loadModels.bind(this));
	}

	protected async loadModels(): Promise<void> {
		const self = this;
		// Autodesk.Viewing.Private.ENABLE_DEBUG =true;
		// Autodesk.Viewing.Private.ENABLE_INLINE_WORKER =false;
		this.configuration.modelBrowserExcludeRoot = this.modelBrowserExcludeRoot;
		this.viewer = new Autodesk.Viewing.GuiViewer3D(
			typeof this.div === 'string' ?
				document.getElementById(this.div as string)
				: this.div,
			this.configuration
		);
		this.viewer.start();

		// Attach event handlers (this would work for all the files except those that doesn't have geometry data).
		this.viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, (info: ModelLoadingInfo): void => {
			//this.viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, arguments.callee);
			info.target.fitToView(undefined, undefined, true);
			setTimeout((): void => {
				(info.target as Autodesk.Viewing.GuiViewer3D).autocam.setHomeViewFrom(info.target.navigation.getCamera());
			}, 1000);

			const endAt = (new Date().getTime() - self.startAt.getTime()) / 1000;
			console.log(`GEOMETRY_LOADED_EVENT => ${endAt}`);
			self.onGeometryLoaded(info);
		});
		this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, (info: ModelLoadingInfo): void => {
			const tree = info.model.getInstanceTree();
			self.onObjectTreeCreated(tree, info);
		});

		//self.viewer.removeEventListener(Autodesk.Viewing.EVENT, arguments.callee);
		// or this.viewer.addEventListener(EVENT, callback, { once: true });
		this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, self.onToolbarCreatedInternal.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_ACTIVATED_EVENT, self.onExtensionActivatedInternal.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_DEACTIVATED_EVENT, self.onExtensionDeactivated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_LOADED_EVENT, self.onExtensionLoaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_ACTIVATED_EVENT, self.onExtensionPreActivated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_DEACTIVATED_EVENT, self.onExtensionPreDeactivated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_LOADED_EVENT, self.onExtensionPreLoaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_UNLOADED_EVENT, self.onExtensionPreUnloaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_UNLOADED_EVENT, self.onExtensionUnloaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.PREF_CHANGED_EVENT, self.onPrefChanged.bind(self));
		// MODEL_ADDED_EVENT, MODEL_REMOVED_EVENT, MODEL_ROOT_LOADED_EVENT (see below)
		//Autodesk.Viewing.Private.Prefs.DISPLAY_UNITS

		this.viewer.disableHighlight(true);
		this.viewer.autocam.shotParams.destinationPercent = 1;
		this.viewer.autocam.shotParams.duration = 3;
		this.viewer.prefs.tag('ignore-producer'); // Ignore the model default environment
		this.viewer.prefs.tag('envMapBackground'); // Ignore the model background image

		if (this.proxy !== null)
			this.activateProxy();

		this.startAt = new Date();
		const jobs = this.urn.map((elt: URN_Config): Promise<Autodesk.Viewing.Model> => this.addViewable(elt.urn, elt.view, elt.xform, elt.offset, elt.ids));
		const models = await Promise.all(jobs);
		this.onModelsLoaded(models);

		this.viewer.addEventListener(Autodesk.Viewing.MODEL_ADDED_EVENT, self.onModelAddedInternal.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.MODEL_REMOVED_EVENT, self.onModelRemovedInternal.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, self.onModelRootLoadedInternal.bind(self));

		// Load extensions
		this.loadExtensions();
	}

	protected async addViewable(urn: string, view?: Autodesk.Viewing.BubbleNodeSearchProps, xform?: THREE.Matrix4, offset?: THREE.Vector3, ids?: number[]): Promise<Autodesk.Viewing.Model> {
		const self = this;
		return (new Promise((resolve: (model: Autodesk.Viewing.Model) => void, reject: (reason?: any) => void): void => {
			const onDocumentLoadSuccess = (doc: Autodesk.Viewing.Document): void => {

				doc.downloadAecModelData() // https://forge.autodesk.com/blog/add-revit-levels-and-2d-minimap-your-3d
					// this.viewer.model.getDocumentNode().getAecModelData()
					// .then((data: any): void => { (doc as any).aecData = data; })
					// .catch((reason: any): void => { (doc as any).aecData = null; });
					.catch((reason: any): void => { });

				self.documents[urn.replace('urn:', '')] = doc;
				const viewable = view ?
					doc.getRoot().search(view)[0]
					: doc.getRoot().getDefaultGeometry();
				let options: { preserveView: boolean, keepCurrentModels: boolean, placementTransform?: THREE.Matrix4, globalOffset?: THREE.Vector3, ids?: number[] } = {
					preserveView: (Object.keys(self.documents).length !== 1),
					keepCurrentModels: true
				};
				if (xform)
					options.placementTransform = xform;
				if (offset)
					options.globalOffset = offset;
				if (ids)
					options.ids = ids;
				self.viewer.loadDocumentNode(doc, viewable, options)
					.then(resolve)
					.catch(reject);
			}
			const onDocumentLoadFailure = (code: any): void => {
				reject(`Could not load document (${code}).`);
			}

			if (!/^(urn|https?):.*$/g.test(urn) && urn[0] !== '/')
				urn = 'urn:' + urn;
			Autodesk.Viewing.Document.load(urn, onDocumentLoadSuccess, onDocumentLoadFailure);
		}));
	}

	protected onModelsLoaded(models: Autodesk.Viewing.Model[]): void {
		const endAt = (new Date().getTime() - this.startAt.getTime()) / 1000;
		console.log(`(${models.length}) models loaded => ${endAt}`);
		this.models = models;

		this.switchToDarkMode();
		this.viewer.setQualityLevel( /* ambient shadows */ false, /* antialiasing */ true);
		this.viewer.setGroundShadow(false);
		this.viewer.setGroundReflection(false);
		this.viewer.setGhosting(true);
		this.viewer.setEnvMapBackground(false);
		this.viewer.setSelectionColor(new THREE.Color(0xEBB30B), /*Autodesk.Viewing.*/SelectionType.MIXED);
		this.viewer.autocam.toPerspective();
	}

	public switchToDarkMode() {
		const darkmode: boolean =
			localStorage.getItem('darkSwitch') !== null &&
			localStorage.getItem('darkSwitch') === 'dark';

		this.viewer.setLightPreset(0);
		this.viewer.setLightPreset(darkmode ? 2 : 6);

		this.viewer.container.classList.remove('dark-theme');
		this.viewer.container.classList.remove('bim-theme');
		this.viewer.container.classList.add(darkmode ? 'dark-theme' : 'bim-theme');

		if (this.darkmode)
			return;
		const self = this;
		this.darkmode = new MutationObserver((mutations: MutationRecord[], observer: MutationObserver): void => {
			//console.log(mutationsList, observer);
			for (const mutation of mutations) {
				if (mutation.type === 'attributes')
					self.switchToDarkMode();
			}
		});
		this.darkmode.observe(document.body, { attributes: true, childList: false, subtree: false });
	}

	protected unloadModel(model: Autodesk.Viewing.Model): void {
		// The list of currently loaded models can be obtained via viewer.getVisibleModels() or viewer.getHiddenModels()
		this.viewer.unloadModel(model);
	}

	public setOptions(evt: any) {
		//this.viewer[evt.name](evt.checked);
	}

	private getAccessTokenFct(onGetAccessToken: Function): void {
		//onGetAccessToken('<%= access_token %>', 82000);
		const options: any = this;
		fetch(options.tokenURL as string)
			.then((response: any): any => {
				if (!response.ok)
					throw new Error(response.statusText)
				return (response.json());
			})
			.then((bearer): void => onGetAccessToken(bearer.access_token, bearer.expires_in));
	}

	public useProxy(path: string = '/forge-proxy', mode: string = 'modelDerivativeV2'): void {
		this.proxy = { path: path, mode: mode };
	}

	private activateProxy(): void {
		Autodesk.Viewing.endpoint.setEndpointAndApi(window.location.origin + this.proxy.path, this.proxy.mode);
	}

	// Events
	// AGGREGATE_FIT_TO_VIEW_EVENT
	// AGGREGATE_HIDDEN_CHANGED_EVENT
	// AGGREGATE_ISOLATION_CHANGED_EVENT
	// AGGREGATE_SELECTION_CHANGED_EVENT
	// ANIMATION_READY_EVENT
	// CAMERA_CHANGE_EVENT
	// CAMERA_TRANSITION_COMPLETED
	// CANCEL_LEAFLET_SCREENSHOT
	// CUTPLANES_CHANGE_EVENT
	// ESCAPE_EVENT
	// EVENT_BIMWALK_CONFIG_CHANGED
	// EXPLODE_CHANGE_EVENT
	// FINAL_FRAME_RENDERED_CHANGED_EVENT
	// FIT_TO_VIEW_EVENT
	// FULLSCREEN_MODE_EVENT
	// HIDE_EVENT
	// HYPERLINK_EVENT
	// HYPERLINK_NAVIGATE
	// ISOLATE_EVENT
	// LAYER_VISIBILITY_CHANGED_EVENT
	// LOADER_LOAD_ERROR_EVENT
	// LOADER_LOAD_FILE_EVENT
	// LOAD_GEOMETRY_EVENT
	// LOAD_MISSING_GEOMETRY
	// MODEL_LAYERS_LOADED_EVENT
	// MODEL_PLACEMENT_CHANGED_EVENT
	// MODEL_TRANSFORM_CHANGED_EVENT
	// MODEL_UNLOADED_EVENT: "modelUnloaded"
	// MODEL_VIEWPORT_BOUNDS_CHANGED_EVENT
	// NAVIGATION_MODE_CHANGED_EVENT
	// OBJECT_TREE_LOAD_PROGRESS_EVENT
	// OBJECT_TREE_UNAVAILABLE_EVENT
	// OBJECT_UNDER_MOUSE_CHANGED
	// PREF_RESET_EVENT
	// PROFILE_CHANGE_EVENT
	// PROGRESS_UPDATE_EVENT
	// RENDER_FIRST_PIXEL
	// RENDER_OPTION_CHANGED_EVENT
	// RENDER_PRESENTED_EVENT
	// RENDER_SCENE_PART
	// RESTORE_DEFAULT_SETTINGS_EVENT
	// SELECTION_CHANGED_EVENT
	// SETTINGS_PANEL_CREATED_EVENT
	// SET_VIEW_EVENT
	// SHOW_ALL_EVENT
	// SHOW_EVENT
	// SHOW_PROPERTIES_EVENT
	// TEXTURES_LOADED_EVENT
	// TOOLBAR_CREATED_EVENT
	// TOOL_CHANGE_EVENT
	// VIEWER_INITIALIZED
	// VIEWER_RESIZE_EVENT
	// VIEWER_STATE_RESTORED_EVENT
	// VIEWER_UNINITIALIZED
	// VIEW_CUBE_CREATED_EVENT
	// WEBGL_CONTEXT_LOST_EVENT
	// WEBGL_CONTEXT_RESTORED_EVENT

	public onGeometryLoaded(info: ModelLoadingInfo): void { }
	public onObjectTreeCreated(tree: Autodesk.Viewing.InstanceTree, info: ModelLoadingInfo): void { }
	private onToolbarCreatedInternal(info: BasicInfo): void {
		const toolbars: Autodesk.Viewing.UI.ToolBar[] = this.buildUI(this.ui_definition);
		this.onToolbarCreated({ ...info, toolbars: toolbars });
	}
	public onToolbarCreated(info: BasicInfo): void { }
	private onModelAddedInternal(modelInfo: ModelLoadingInfo): void {
		this.models.push(modelInfo.model);
		this.onModelAdded(modelInfo);
	}
	public onModelAdded(modelInfo: ModelLoadingInfo): void { }
	private onModelRemovedInternal(modelInfo: ModelLoadingInfo): void {
		const lastModelRemoved = !this.viewer.getVisibleModels().length;
		this.models = this.models.filter((elt: Autodesk.Viewing.Model): boolean => elt !== modelInfo.model);
		this.onModelRemoved(modelInfo);
	}
	public onModelRemoved(modelInfo: ModelLoadingInfo): void { }
	private onModelRootLoadedInternal(modelInfo: ModelLoadingInfo): void {
		//this.reconfigureExtensions();
		this.onModelRootLoaded(modelInfo);
	}
	public onModelRootLoaded(modelInfo: ModelLoadingInfo): void { }
	public onExtensionActivatedInternal(extensionInfo: ExtensionInfo): void {
		this.reconfigureExtensions(extensionInfo);
		this.onExtensionActivated(extensionInfo);
	}
	public onExtensionActivated(extensionInfo: ExtensionInfo): void { }
	public onExtensionDeactivated(extensionInfo: ExtensionInfo): void { }
	public onExtensionLoaded(extensionInfo: ExtensionInfo): void { }
	public onExtensionPreActivated(extensionInfo: ExtensionInfo): void { }
	public onExtensionPreDeactivated(extensionInfo: ExtensionInfo): void { }
	public onExtensionPreLoaded(extensionInfo: ExtensionInfo): void { }
	public onExtensionPreUnloaded(extensionInfo: ExtensionInfo): void { }
	public onExtensionUnloaded(extensionInfo: ExtensionInfo): void { }
	public onPrefChanged(event?: any): void { }

	// Utilities ( https://github.com/petrbroz/forge-viewer-utils/blob/develop/src/Utilities.js )

	private throwObjectTreeError(errorCode: number, errorMsg: string, statusCode: number, statusText: string): void { throw new Error(errorMsg); };

	/**
	 * Finds all scene objects on specific X,Y position on the canvas.
	 * @param {number} x X-coordinate, i.e., horizontal distance (in pixels) from the left border of the canvas.
	 * @param {number} y Y-coordinate, i.e., vertical distance (in pixels) from the top border of the canvas.
	 * @returns {Intersection[]} List of intersections.
	 * 
	 * @example
	 * document.getElementById('viewer').addEventListener('click', (ev) => {
	 *   const bounds = ev.target.getBoundingClientRect();
	 *   const intersections = utils.rayCast(ev.clientX - bounds.left, ev.clientY - bounds.top);
	 *   if (intersections.length > 0) {
	 *     console.log('hit', intersections[0]);
	 *   } else {
	 *     console.log('miss');
	 *   }
	 * });
	 */
	public rayCast(x: number, y: number): Intersection[] {
		let intersections: Intersection[] = [];
		(this.viewer.impl as any).castRayViewport(this.viewer.impl.clientToViewport(x, y), false, null, null, intersections);
		return (intersections);
	}

	/**
	 * Search text in all models loaded.
	 *
	 * @param {string} text Text to search.
	 *
	 * @returns {Promise<{ model: Autodesk.Viewing.Model, dbids: number[] }[]>} Promise that will be resolved with a list of IDs per Models,
	 */
	public searchAllModels(text: string): Promise<{ model: Autodesk.Viewing.Model, dbids: number[] }[]> {
		const viewer: Autodesk.Viewing.Viewer3D = this.viewer;
		return (new Promise((resolve: (data: { model: Autodesk.Viewing.Model, dbids: number[] }[]) => void, reject: (reason?: any) => void): void => {
			let results: { model: Autodesk.Viewing.Model, dbids: number[] }[] = [];
			const models: Autodesk.Viewing.Model[] = viewer.getVisibleModels();
			models.forEach((model: Autodesk.Viewing.Model): void => {
				model.search(
					text,
					(dbids: number[]): void => {
						results.push({ model, dbids });
						if (results.length === models.length)
							resolve(results);
					},
					(err?: any): void => reject(err)
				);
			});
		}));
	}

	/**
	 * Enumerates IDs of objects in the scene.
	 *
	 * To make sure the method call is synchronous (i.e., it returns *after*
	 * all objects have been enumerated), always wait until the object tree
	 * has been loaded.
	 *
	 * @param {NodeCallback} callback Function called for each object.
	 * @param {boolean} [recursive = true] Should iterate children (default to true)
	 * @param {number?} parentId ID of the parent object whose children
	 * should be enumerated. If undefined, the enumeration includes all scene objects.
	 * @throws Exception if no {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/model|Model} is loaded.
	 *
	 * @example
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, () => {
	 *   try {
	 *     utils.enumerateNodes((id) => {
	 *       console.log('Found node', id);
	 *     });
	 *   } catch(err) {
	 *     console.error('Could not enumerate nodes', err);
	 *   }
	 * });
	 */
	public enumerateNodes(callback: NodeCallback, recursive: boolean = true, parentId?: number): void {
		const proceed = (tree: Autodesk.Viewing.InstanceTree): void => {
			if (typeof parentId === 'undefined')
				parentId = tree.getRootId();
			tree.enumNodeChildren(parentId, callback, recursive);
		}

		this.viewer.getObjectTree(proceed, this.throwObjectTreeError);
	}

	/**
	 * Lists IDs of objects in the scene.
	 * @param {boolean} [recursive = true] Should iterate children (default to true)
	 * @param {number?} parentId ID of the parent object whose children
	 * should be listed. If undefined, the list will include all scene object IDs.
	 * @returns {Promise<number[]>} Promise that will be resolved with a list of IDs,
	 * or rejected with an error message, for example, if there is no
	 * {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/model|Model}.
	 *
	 * @example <caption>Using async/await</caption>
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
	 *   const ids = await utils.listNodes();
	 *   console.log('Object IDs', ids);
	 * });
	 */
	public listNodes(recursive: boolean = true, parentId?: number): Promise<number[]> {
		const viewer = this.viewer;
		return (new Promise((resolve: (value: number[]) => void, reject: (reason?: any) => void): void => {
			const proceed = (tree: Autodesk.Viewing.InstanceTree): void => {
				if (typeof parentId === 'undefined')
					parentId = tree.getRootId();
				let ids: number[] = [];
				tree.enumNodeChildren(parentId, (id: number): void => { ids.push(id); }, recursive);
				resolve(ids);
			}

			viewer.getObjectTree(proceed, reject);
		}));
	}

	/**
	 * Enumerates IDs of leaf objects in the scene.
	 *
	 * To make sure the method call is synchronous (i.e., it returns *after*
	 * all objects have been enumerated), always wait until the object tree
	 * has been loaded.
	 *
	 * @param {NodeCallback} callback Function called for each object.
	 * @param {boolean} [recursive = true] Should iterate children (default to true)
	 * @param {number?} parentId ID of the parent object whose children
	 * should be enumerated. If undefined, the enumeration includes all leaf objects.
	 * @throws Exception if no {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/model|Model} is loaded.
	 *
	 * @example
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, () => {
	 *   try {
	 *     utils.enumerateLeafNodes((id) => {
	 *       console.log('Found leaf node', id);
	 *     });
	 *   } catch(err) {
	 *     console.error('Could not enumerate nodes', err);
	 *   }
	 * });
	 */
	public enumerateLeafNodes(callback: NodeCallback, recursive: boolean = true, parentId?: number): void {
		const proceed = (tree: Autodesk.Viewing.InstanceTree): void => {
			if (typeof parentId === 'undefined')
				parentId = tree.getRootId();
			tree.enumNodeChildren(
				parentId,
				(id: number): void => { if (tree.getChildCount(id) === 0) callback(id); },
				recursive
			);
		}
		this.viewer.getObjectTree(proceed, this.throwObjectTreeError);
	}

	/**
	 * Lists IDs of leaf objects in the scene.
	 * @param {boolean} [recursive = true] Should iterate children (default to true)
	 * @param {number?} [parentId = undefined] ID of the parent object whose children
	 * should be listed. If undefined, the list will include all leaf object IDs.
	 * @returns {Promise<number[]>} Promise that will be resolved with a list of IDs,
	 * or rejected with an error message, for example, if there is no
	 * {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/model|Model}.
	 *
	 * @example <caption>Using async/await</caption>
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
	 *   const ids = await utils.listLeafNodes();
	 *   console.log('Leaf object IDs', ids);
	 * });
	 */
	public listLeafNodes(recursive: boolean = true, parentId?: number): Promise<number[]> {
		const viewer = this.viewer;
		return (new Promise((resolve: (value: number[]) => void, reject: (reason?: any) => void): void => {
			const proceed = (tree: Autodesk.Viewing.InstanceTree): void => {
				if (typeof parentId === 'undefined')
					parentId = tree.getRootId();
				let ids: number[] = [];
				tree.enumNodeChildren(
					parentId,
					(id: number): void => { if (tree.getChildCount(id) === 0) ids.push(id); },
					recursive
				);
				resolve(ids);
			}

			viewer.getObjectTree(proceed, reject);
		}));
	}

	/**
	 * Enumerates fragment IDs of specific object or entire scene.
	 *
	 * To make sure the method call is synchronous (i.e., it returns *after*
	 * all fragments have been enumerated), always wait until the object tree
	 * has been loaded.
	 *
	 * @param {FragmentCallback} callback Function called for each fragment.
	 * @param {boolean} [recursive = true] Should iterate children (default to true)
	 * @param {number?} parentId ID of the parent object whose fragments
	 * should be enumerated. If undefined, the enumeration includes all scene fragments.
	 * @throws Exception if no {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/model|Model} is loaded.
	 *
	 * @example
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, () => {
	 *   try {
	 *     utils.enumerateFragments((id) => {
	 *       console.log('Found fragment', id);
	 *     });
	 *   } catch(err) {
	 *     console.error('Could not enumerate fragments', err);
	 *   }
	 * });
	 */
	public enumerateFragments(callback: FragmentCallback, recursive: boolean = true, parentId?: number): void {
		const proceed = (tree: Autodesk.Viewing.InstanceTree): void => {
			if (typeof parentId === 'undefined')
				parentId = tree.getRootId();
			tree.enumNodeFragments(parentId, callback, recursive);
		}

		this.viewer.getObjectTree(proceed, this.throwObjectTreeError);
	}

	/**
	 * Lists fragments IDs of specific scene object.
	 * Should be called *after* the object tree has been loaded.
	 * @param {boolean} [recursive = true] Should iterate children (default to true)
	 * @param {number?} [parentId = undefined] ID of the parent object whose fragments
	 * should be listed. If undefined, the list will include all fragment IDs.
	 * @returns {Promise<number[]>} Promise that will be resolved with a list of IDs,
	 * or rejected with an error message, for example, if there is no
	 * {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/model|Model}.
	 *
	 * @example <caption>Using async/await</caption>
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
	 *   const ids = await utils.listFragments();
	 *   console.log('Fragment IDs', ids);
	 * });
	 */
	public listFragments(recursive: boolean = true, parentId?: number): Promise<number[]> {
		const viewer = this.viewer;
		return (new Promise((resolve: (value: number[]) => void, reject: (reason?: any) => void): void => {
			const proceed = (tree: Autodesk.Viewing.InstanceTree): void => {
				if (typeof parentId === 'undefined')
					parentId = tree.getRootId();
				let ids: number[] = [];
				tree.enumNodeFragments(parentId, (id): void => { ids.push(id); }, recursive);
				resolve(ids);
			}

			viewer.getObjectTree(proceed, reject);
		}));
	}

	/**
	 * Gets world bounding box of scene fragment.
	 * @param {Autodesk.Viewing.Model} model Model instance
	 * @param {number} fragId Fragment ID.
	 * @param {THREE.Box3} [bounds] {@link https://threejs.org/docs/#api/en/math/Box3|Box3}
	 * to be populated with bounding box values and returned
	 * (in case you want to avoid creating a new instance for performance reasons).
	 * @returns {THREE.Box3} Transformation {@link https://threejs.org/docs/#api/en/math/Box3|Box3}.
	 * @throws Exception when the fragments are not yet available.
	 */
	public getFragmentBounds(model: Autodesk.Viewing.Model, fragId: number, bounds: THREE.Box3 = null): THREE.Box3 {
		// if (!this.viewer.model)
		// 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
		const frags = model.getFragmentList();
		(frags as any).getWorldBounds(fragId, bounds || new THREE.Box3());
		return (bounds);
	}

	/**
	 * Gets _original_ transformation matrix of scene fragment, i.e.,
	 * the transformation that was loaded from the Forge model.
	 *
	 * @param {Autodesk.Viewing.Model} model Model instance
	 * @param {number} fragId Fragment ID.
	 * @param {THREE.Matrix4} transform Matrix to be populated with transform values and returned
	 * (in case you want to avoid creating a new instance for performance reasons).
	 * @returns {THREE.Matrix4} Transformation {@link https://threejs.org/docs/#api/en/math/Matrix4|Matrix4}.
	 * @throws Exception when the fragments are not yet available.
	 *
	 * @example
	 * const fragId = 123;
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
	 *     const transform = utils.getFragmentOrigTransform(fragId);
	 *     console.log('Original fragment transform', transform);
	 * });
	 */
	public getFragmentOrigTransform(model: Autodesk.Viewing.Model, fragId: number, transform: THREE.Matrix4 = null): THREE.Matrix4 {
		const frags = model.getFragmentList();
		(frags as any).getOriginalWorldMatrix(fragId, transform || new THREE.Matrix4());
		return (transform);
	}

	/**
	 * Gets _auxiliary_ transform of a scene fragment.
	 *
	 * Note: auxiliary transforms are applied "on top" of the original
	 * transforms, and are used by different features of the viewer,
	 * for example, by animations or the explode tool.
	 *
	 * @param {Autodesk.Viewing.Model} model Model instance
	 * @param {number} fragId Fragment ID.
	 * @param {THREE.Vector3} scale Vector to be populated with scale values.
	 * @param {THREE.Quaternion} rotation Quaternion to be populated with rotation values.
	 * @param {THREE.Vector3} position Vector to be populated with offset values.
	 * @throws Exception if the fragments are not yet available.
	 *
	 * @example
	 * const fragId = 123;
	 * let scale = new THREE.Vector3(1, 1, 1);
	 * let rotation = new THREE.Quaternion(0, 0, 0, 1);
	 * let position = new THREE.Vector3(0, 0, 0);
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
	 *   utils.getFragmentAuxTransform(fragId, scale, rotation, position);
	 *   console.log('Scale', scale);
	 *   console.log('Rotation', rotation);
	 *   console.log('Position', position);
	 * });
	 */
	public getFragmentAuxTransform(model: Autodesk.Viewing.Model, fragId: number, scale: THREE.Vector3 = null, rotation: THREE.Quaternion = null, position: THREE.Vector3 = null): void {
		// if (!this.viewer.model)
		// 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
		const frags = model.getFragmentList();
		frags.getAnimTransform(fragId, scale, rotation, position);
	}

	/**
	 * Sets _auxiliary_ transform of a scene fragment.
	 *
	 * Note: auxiliary transforms are applied "on top" of the original
	 * transforms, and are used by different features of the viewer,
	 * for example, by animations or the explode tool.
	 *
	 * @param {Autodesk.Viewing.Model} model Model instance
	 * @param {number} fragId Fragment ID.
	 * @param {THREE.Vector3} [scale] Vector with new scale values.
	 * @param {THREE.Quaternion} [rotation] Quaternion with new rotation values.
	 * @param {THREE.Vector3} [position] Vector with new offset values.
	 * @throws Exception if the fragments are not yet available.
	 *
	 * @example
	 * const fragId = 123;
	 * const scale = new THREE.Vector3(2.0, 3.0, 4.0);
	 * const position = new THREE.Vector3(5.0, 6.0, 7.0);
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
	 *   utils.setFragmentAuxTransform(fragId, scale, null, position);
	 * });
	 */
	public setFragmentAuxTransform(model: Autodesk.Viewing.Model, fragId: number, scale: THREE.Vector3 = null, rotation: THREE.Quaternion = null, position: THREE.Vector3 = null): void {
		// if (!this.viewer.model)
		// 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
		const frags = model.getFragmentList();
		frags.updateAnimTransform(fragId, scale, rotation, position);
	}

	/**
	 * Gets _final_ transformation matrix of scene fragment, i.e.,
	 * the transformation obtained by combining the _original_ and
	 * the _auxiliar_ transforms.
	 *
	 * @param {Autodesk.Viewing.Model} model Model instance
	 * @param {number} fragId Fragment ID.
	 * @param {THREE.Matrix4} [transform] Matrix to be populated with transform values and returned
	 * (in case you want to avoid creating a new instance for performance reasons).
	 * @returns {THREE.Matrix4} Transformation {@link https://threejs.org/docs/#api/en/math/Matrix4|Matrix4}.
	 * @throws Exception when the fragments are not yet available.
	 *
	 * @example
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
	 *   try {
	 *     const transform = utils.getFragmentTransform(1);
	 *     console.log('Final fragment transform', transform);
	 *   } catch(err) {
	 *     console.error('Could not retrieve fragment transform', err);
	 *   }
	 * });
	 */
	public getFragmentTransform(model: Autodesk.Viewing.Model, fragId: number, transform: THREE.Matrix4 = null) {
		// if (!this.viewer.model)
		// 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
		const frags = model.getFragmentList();
		(frags as any).getWorldMatrix(fragId, transform || new THREE.Matrix4());
		return (transform);
	}

	/**
	 * Re-renders entire scene, including overlay scenes. Should only be called
	 * when absolutely needed, for example after updating aux. transforms
	 * of multiple fragments using {@link setFragmentAuxiliaryTransform}.
	 */
	public refresh(): void {
		this.viewer.impl.invalidate(true, true, true);
	}

	// UI

	public getToolbar(id: string = 'default'): Autodesk.Viewing.UI.ToolBar {
		return (id === 'default' || id === 'guiviewer3d-toolbar' ? this.viewer.getToolbar(true) : this.ui_references[id] as Autodesk.Viewing.UI.ToolBar);
	}

	protected createToolbar(id: string, def: UIToolbarDefinition): Autodesk.Viewing.UI.ToolBar {
		if (this.ui_references[id])
			return (this.ui_references[id] as Autodesk.Viewing.UI.ToolBar);

		const tb: Autodesk.Viewing.UI.ToolBar = new Autodesk.Viewing.UI.ToolBar(id);
		if (def.isVertical)
			tb.container.classList.add('adsk-toolbar-vertical');
		const offsetV: string = '10px';
		const offsetH: string = '15px';
		if (def.top || def.docking === 'top') {
			tb.container.style.top = def.top || offsetV;
			tb.container.style.bottom = 'unset';
			tb.container.classList.add('dock-top');
		}
		if (def.bottom || def.docking === 'bottom') {
			tb.container.style.bottom = def.bottom || offsetV;
			tb.container.style.top = 'unset';
		}
		if (def.left || def.docking === 'left') {
			tb.container.style.left = def.left || offsetH;
			tb.container.style.right = 'unset';
			tb.container.classList.add('dock-left');
		}
		if (def.right || def.docking === 'right') {
			tb.container.style.right = def.right || offsetH;
			tb.container.style.left = 'unset';
		}
		//tb.setGlobalManager(this.viewer.getGlobalManager);
		//tb.setVisible(true);
		this.viewer.container.appendChild(tb.container);
		this.ui_references[id] = tb;
		return (tb);
	}

	public getGroupCtrl(tb: Autodesk.Viewing.UI.ToolBar, id: string): Autodesk.Viewing.UI.ControlGroup {
		return (tb.getControl(id) as Autodesk.Viewing.UI.ControlGroup);
	}

	protected createControlGroup(viewerToolbar: Autodesk.Viewing.UI.ToolBar, groupName: string): Autodesk.Viewing.UI.ControlGroup {
		if (viewerToolbar.getControl(groupName))
			return (viewerToolbar.getControl(groupName) as Autodesk.Viewing.UI.ControlGroup);
		const groupCtrl: Autodesk.Viewing.UI.ControlGroup = new Autodesk.Viewing.UI.ControlGroup(groupName);
		//groupCtrl.setVisible(true);
		//groupCtrl.container.classList.add('toolbar-vertical-group');
		viewerToolbar.addControl(groupCtrl);
		this.ui_references[groupName] = groupCtrl;
		return (groupCtrl);
	}

	protected createRadioButtonGroup(viewerToolbar: Autodesk.Viewing.UI.ToolBar, groupName: string): Autodesk.Viewing.UI.RadioButtonGroup {
		if (viewerToolbar.getControl(groupName))
			return (viewerToolbar.getControl(groupName) as Autodesk.Viewing.UI.RadioButtonGroup);
		const groupCtrl: Autodesk.Viewing.UI.RadioButtonGroup = new Autodesk.Viewing.UI.RadioButtonGroup(groupName);
		groupCtrl.setVisible(true);
		viewerToolbar.addControl(groupCtrl);
		this.ui_references[groupName] = groupCtrl;
		return (groupCtrl);
	}

	protected createButton(id: string, def: UIButtonDefinition): Autodesk.Viewing.UI.Button {
		const self = this;

		const ctrl: Autodesk.Viewing.UI.Button = def.children ?
			new Autodesk.Viewing.UI.ComboButton(id, { collapsible: (def.collapsible || def.children || false) })
			: def.bistate !== undefined ?
				new BistateButton(id, { bistate: def.bistate })
				: new Autodesk.Viewing.UI.Button(id, { collapsible: (def.collapsible || def.children || false) });

		ctrl.setToolTip(def.tooltip || '');
		//ctrl.setIcon(iconClass); // Unfortunately this API removes the previous class style applied :()
		if (typeof def.iconClass === 'string')
			def.iconClass = [def.iconClass];
		(def.iconClass || []).forEach((elt: string): void => (ctrl as any).icon.classList.add(elt));
		if (typeof def.buttonClass === 'string')
			def.buttonClass = [def.buttonClass];
		//(def.buttonClass || []).forEach((elt: string): void => ctrl.addClass(elt));
		(def.buttonClass || []).forEach((elt: string): void => (ctrl as any).container.classList.add(elt));

		ctrl.setVisible(def.visible !== undefined ? def.visible : true);
		ctrl.setState(def.state !== undefined ? def.state : Autodesk.Viewing.UI.Button.State.INACTIVE);

		ctrl.onClick = def.onClick || this._dumb_.bind(this);
		ctrl.onMouseOut = def.onMouseOut || this._dumb_.bind(this);
		ctrl.onMouseOver = def.onMouseOver || this._dumb_.bind(this);

		if (def.onVisibiltyChanged)
			ctrl.addEventListener(Autodesk.Viewing.UI.VISIBILITY_CHANGED, def.onVisibiltyChanged);
		if (def.onStateChanged)
			ctrl.addEventListener(Autodesk.Viewing.UI.STATE_CHANGED, def.onStateChanged);
		if (def.onCollapseChanged)
			ctrl.addEventListener(Autodesk.Viewing.UI.COLLAPSED_CHANGED, def.onCollapseChanged);

		if (def.children) {
			const combo: Autodesk.Viewing.UI.ComboButton = ctrl as Autodesk.Viewing.UI.ComboButton;
			const ctrls: Autodesk.Viewing.UI.Button[] = def.children.map((child: UIButtonDefinition): Autodesk.Viewing.UI.Button => { return (this.createButton(child.id, child)); });
			ctrls.map((button: Autodesk.Viewing.UI.Button): void => combo.addControl(button));
			ctrls.map((button: Autodesk.Viewing.UI.Button): void => {
				(button as any)._clientOnClick = button.onClick;
				(button as any)._parentCtrl = combo;
				button.onClick = self.onClickComboChild.bind(self);
			});

			if (!def.onClick && !def.iconClass)
				this.assignComboButton(combo, ctrls[0])

			combo.saveAsDefault();
		}

		this.ui_references[id] = ctrl;
		return (ctrl);
	}

	protected createButtonInGroup(groupCtrl: Autodesk.Viewing.UI.ControlGroup, id: string, def: UIButtonDefinition): Autodesk.Viewing.UI.Button {
		const button: Autodesk.Viewing.UI.Button = this.createButton(id, def);
		groupCtrl.addControl(button, { index: (def.index || groupCtrl.getNumberOfControls()) }); // bug in type definition (aka interface AddControlOptions)
		return (button);
	}

	protected assignComboButton(combo: Autodesk.Viewing.UI.ComboButton, button: Autodesk.Viewing.UI.Button): void {
		combo.setToolTip(button.getToolTip() || '');
		combo.setVisible(button.isVisible());
		combo.setState(button.getState());
		combo.onClick = (button as any)._clientOnClick || this._dumb_.bind(this);

		(combo as any).icon.classList.forEach((element: string): void => (combo as any).icon.classList.remove(element));
		(button as any).icon.classList.forEach((element: string): void => (combo as any).icon.classList.add(element));

		(combo as any).container.classList.forEach((element: string): void => (combo as any).container.classList.remove(element));
		(button as any).container.classList.forEach((element: string): void => (combo as any).container.classList.add(element));

		(combo as any)._activeButton = button;
	}

	protected onClickComboChild(evt: Event): void {
		const button: Autodesk.Viewing.UI.Button = this.ui_references[(evt.currentTarget as any).id] as Autodesk.Viewing.UI.Button;
		const radioCtrl: Autodesk.Viewing.UI.RadioButtonGroup = (button as any).parent;
		const combo: Autodesk.Viewing.UI.ComboButton = (button as any)._parentCtrl;
		this.assignComboButton(combo, button);
		(radioCtrl as any)._activeButton = button;

		if ((button as any)._clientOnClick)
			(button as any)._clientOnClick.call(self, evt);
	}

	public getUI(): string[] {
		const toolbars: Set<Autodesk.Viewing.UI.ToolBar> = new Set<Autodesk.Viewing.UI.ToolBar>([this.viewer.getToolbar(true)]);
		Object.values(this.ui_references)
			.filter((elt: Autodesk.Viewing.UI.ToolBar | Autodesk.Viewing.UI.Control): any => elt instanceof Autodesk.Viewing.UI.ToolBar)
			.forEach((tb: Autodesk.Viewing.UI.ToolBar) => toolbars.add(tb));

		let ids: string[] = [];
		toolbars.forEach((tb: Autodesk.Viewing.UI.ToolBar): void => {
			const groupIterator = (parent: Autodesk.Viewing.UI.ControlGroup, path: string) => {
				const nbc: number = parent.getNumberOfControls();
				for (let c = 0; c < nbc; c++) {
					const ctrl: Autodesk.Viewing.UI.Control = parent.getControl(parent.getControlId(c));
					ids.push([path, ctrl.getId()].join('/'));
					if (ctrl instanceof Autodesk.Viewing.UI.ComboButton) {
						const button: Autodesk.Viewing.UI.ComboButton = ctrl as Autodesk.Viewing.UI.ComboButton;
						// shall we return options?
						const subMenu: Autodesk.Viewing.UI.RadioButtonGroup = (button as any).subMenu as Autodesk.Viewing.UI.RadioButtonGroup;
						ids.push([path, ctrl.getId(), subMenu.getId()].join('/'));
						groupIterator(subMenu, [path, ctrl.getId(), subMenu.getId()].join('/'));
					} else if (ctrl instanceof Autodesk.Viewing.UI.ControlGroup) {
						const group: Autodesk.Viewing.UI.ControlGroup = ctrl as Autodesk.Viewing.UI.ControlGroup;
						groupIterator(group, [path, group.getId()].join('/'));
					} else {
						const button: Autodesk.Viewing.UI.Button = ctrl as Autodesk.Viewing.UI.Button;
						// all done!
					}
				}
			};

			ids.push('//' + tb.getId());
			groupIterator(tb, '//' + tb.getId());
		});

		return (ids);
	}

	public getControls(searchpath: string | string[]): Autodesk.Viewing.UI.Control[] {
		const self = this;
		if (typeof searchpath === 'string')
			searchpath = [searchpath];
		//let all: Set<Autodesk.Viewing.UI.Control> = new Set<Autodesk.Viewing.UI.Control>();
		const uipath = this.getUI();
		const ctrls: Autodesk.Viewing.UI.Control[][] = searchpath.map((criteria: string): Autodesk.Viewing.UI.Control[] => {
			criteria = criteria.replace(/\*/g, '.*');
			const regex: RegExp = new RegExp(criteria);
			const results: string[] = uipath.filter((idpath: string): boolean => regex.test(idpath));
			//all = new Set<Autodesk.Viewing.UI.Control>([ ...all, ...results ])
			const selection: Autodesk.Viewing.UI.Control[] = results.map((idpath: string): Autodesk.Viewing.UI.Control => self.getControl(idpath));
			return (selection);
		});
		let all: Set<Autodesk.Viewing.UI.Control> = new Set<Autodesk.Viewing.UI.Control>((ctrls as any).flat());
		return (Array.from(all));
	}

	public getControl(idpath: string): Autodesk.Viewing.UI.Control {
		const ids = idpath.split('/').slice(2); // remove '//'
		let ctrl: Autodesk.Viewing.UI.Control = null;
		ids.forEach((id: string): void => {
			if (!ctrl) {
				ctrl = this.getToolbar(id);
			} else if (ctrl instanceof Autodesk.Viewing.UI.ControlGroup) {
				const group: Autodesk.Viewing.UI.ControlGroup = ctrl as Autodesk.Viewing.UI.ControlGroup;
				ctrl = group.getControl(id);
			} else if (ctrl instanceof Autodesk.Viewing.UI.ComboButton) {
				const button: Autodesk.Viewing.UI.ComboButton = ctrl as Autodesk.Viewing.UI.ComboButton;
				const subMenu: Autodesk.Viewing.UI.RadioButtonGroup = (button as any).subMenu as Autodesk.Viewing.UI.RadioButtonGroup;
				if (subMenu.getId() !== id) // path skip the intermediate subMenu group, id represent the option (button)
					ctrl = subMenu.getControl(id);
			} else {
				const button: Autodesk.Viewing.UI.Button = ctrl as Autodesk.Viewing.UI.Button;
				if ( button.getId() !== id )
					ctrl = null;
				// all done!
			}
		});
		return (ctrl);
	}

	protected _dumb_(evt: Event): void { }

	public buildUI(ui_definition: UIConfiguration): Autodesk.Viewing.UI.ToolBar[] {
		const self = this;
		const toolbars: Set<Autodesk.Viewing.UI.ToolBar> = new Set<Autodesk.Viewing.UI.ToolBar>([this.viewer.getToolbar(true)]);
		Object.keys(ui_definition as any).map((tbId: string): void => {
			const tbDef: UIToolbarDefinition = self.ui_definition[tbId];
			const tb: Autodesk.Viewing.UI.ToolBar = self.getToolbar(tbId) || self.createToolbar(tbId, tbDef);
			Object.keys(tbDef as any).map((grpId: string): void => {
				const grpDef: any = tbDef[grpId];
				if (['top', 'left', 'bottom', 'right', 'docking', 'isVertical'].indexOf(grpId) > -1)
					return;
				const groupCtrl: Autodesk.Viewing.UI.ControlGroup = self.getGroupCtrl(tb, grpId) || self.createControlGroup(tb, grpId);
				Object.values(grpDef as any).map((ctrlDef: any): void => {
					//const ctrlDef: any = grpDef[ctrlId];
					const ctrl = groupCtrl.getControl(ctrlDef.id) || self.createButtonInGroup(groupCtrl, ctrlDef.id, ctrlDef);
				});
			});
			toolbars.add(tb);
		});

		return (Array.from(toolbars));
	}

	// Viewer options
	private options(config: ResourceType): object {
		const getAccessToken = typeof this.getAccessToken === 'string' ?
			this.getAccessTokenFct
			: this.getAccessToken;
		const options: { [index: string]: any } = {
			svf: {
				env: 'AutodeskProduction',
				api: 'derivativeV2' + (this.region === 'EMEA' ? '_EU' : ''), // derivativeV2/derivativeV2_EU
				useCookie: false, // optional for Chrome browser
				useCredentials: true,
				//acmSessionId: urn,
				getAccessToken: getAccessToken,
				tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
				//accessToken: '',
			},
			otg: {
				env: 'FluentProduction' + (this.region === 'EMEA' ? 'EU' : ''), // FluentProduction/FluentProductionEU
				api: 'fluent',
				useCookie: false, // optional for Chrome browser
				useCredentials: true,
				//acmSessionId: urn,
				getAccessToken: getAccessToken,
				tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
				//accessToken: '',
				//disableWebSocket: true, // on url param
				//disableIndexedDb: true, // on url param
			},
			svf2: {
				env: (this.region === 'EMEA' ? 'MD20ProdEU' : 'MD20ProdUS'),
				api: 'D3S',
				//useCookie: false, // optional for Chrome browser
				//useCredentials: true,
				//acmSessionId: urn,
				getAccessToken: getAccessToken,
				tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
				//accessToken: '',
				//disableWebSocket: true, // on url param
				//disableIndexedDb: true, // on url param
			},
			svf_local: {
				env: 'Local',
				getAccessToken: getAccessToken,
				tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
				//accessToken: '',
			},
			otg_local: {
				env: 'Local',
				api: 'fluent',
				//useCookie: false,  //optional for Chrome browser
				//useCredentials: false
				//disableWebSocket: true, // on url param
				//disableIndexedDb: true, // on url param
				endpoint: this.endpoint,
				tokenURL: null,
			},
			svf2_local: {
				env: 'Local',
				api: 'fluent',
				//useCookie: false,  //optional for Chrome browser
				//useCredentials: false
				//disableWebSocket: true, // on url param
				//disableIndexedDb: true, // on url param
				endpoint: this.endpoint,
				tokenURL: null,
			}
		};
		//options[config]['extensions'] = ['Autodesk.DocumentBrowser'];
		return (options[config])
	};

}
