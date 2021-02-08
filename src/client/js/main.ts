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
   UI - https://github.com/cyrillef/extract.autodesk.io/blob/master/views/explore.ejs
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
	xform?: THREE.Matrix4;
	offset?: THREE.Vector3;
	ids?: number[];
};
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

interface VisualClustersExtensionOptions {
	attribName: string;
	searchAncestors: boolean;
}

class LocalViewer {

	private div: HTMLElement | string;
	private urn: URN_Config[];
	private getAccessToken: Function | string;
	private region: Region;
	private endpoint: string;
	private proxy: { path: string, mode: string } = null;

	private viewer: Autodesk.Viewing.GuiViewer3D = null;
	private configuration: object = null;
	private extensions: (string | { id: string, options: object })[] = null;
	private documents: { [index: string]: Autodesk.Viewing.Document } = {};
	private models: Autodesk.Viewing.Model[] = null;
	private startAt: Date = null;
	private darkmode: MutationObserver = null;

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
		this.urn = temp.map((elt: string | URN_Config) => typeof elt === 'string' ? { urn: elt } : (isURN_Config(elt) ? elt : null));
		this.urn = this.urn.filter((elt: string | URN_Config) => elt !== null);
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

	public loadExtensions(extensions: (string | { id: string, options: object })[]) {
		this.extensions = extensions;
	}

	public enableWorkersDebugging() {
		(Autodesk.Viewing.Private as any).ENABLE_INLINE_WORKER = false;
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
		this.viewer = new Autodesk.Viewing.GuiViewer3D(
			typeof this.div === 'string' ?
				document.getElementById(this.div as string)
				: this.div,
			this.configuration
		);
		this.viewer.start();

		// Attach event handlers (this would work for all the files except those that doesn't have geometry data).
		this.viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, (event) => {
			//this.viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, arguments.callee);
			self.viewer.fitToView(undefined, undefined, true);
			setTimeout(() => {
				self.viewer.autocam.setHomeViewFrom(this.viewer.navigation.getCamera());
			}, 1000);

			const endAt = (new Date().getTime() - this.startAt.getTime()) / 1000;
			console.log(`GEOMETRY_LOADED_EVENT => ${endAt}`);
			self.onGeometryLoaded(event);
		});
		this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, (event) => {
			const tree = self.viewer.model.getInstanceTree();
			self.onObjectTreeCreated(tree, event);
		});

		//self.viewer.removeEventListener(Autodesk.Viewing.EVENT, arguments.callee);
		// or this.viewer.addEventListener(EVENT, callback, { once: true });
		this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, self.onToolbarCreated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_ACTIVATED_EVENT, self.onExtensionActivated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_DEACTIVATED_EVENT, self.onExtensionDeactivated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_LOADED_EVENT, self.onExtensionLoaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_ACTIVATED_EVENT, self.onExtensionPreActivated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_DEACTIVATED_EVENT, self.onExtensionPreDeactivated.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_LOADED_EVENT, self.onExtensionPreLoaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_UNLOADED_EVENT, self.onExtensionPreUnloaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_UNLOADED_EVENT, self.onExtensionUnloaded.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.PREF_CHANGED_EVENT, self.onPrefChanged.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, self.onModelRootLoaded.bind(self));

		this.viewer.disableHighlight(true);
		this.viewer.autocam.shotParams.destinationPercent = 1;
		this.viewer.autocam.shotParams.duration = 3;
		this.viewer.prefs.tag('ignore-producer'); // Ignore the model default environment
		this.viewer.prefs.tag('envMapBackground'); // Ignore the model background image

		if (this.proxy !== null)
			this.activateProxy();

		this.startAt = new Date();
		const jobs = this.urn.map((elt: URN_Config) => this.addViewable(elt.urn, elt.xform, elt.offset, elt.ids));
		const models = await Promise.all(jobs);
		this.onModelsLoaded(models);

		this.viewer.addEventListener(Autodesk.Viewing.MODEL_ADDED_EVENT, self.onModelAddedInternal.bind(self));
		this.viewer.addEventListener(Autodesk.Viewing.MODEL_REMOVED_EVENT, self.onModelRemovedInternal.bind(self));

		// Load extensions
		this.extensions.map((elt: string | { id: string, options: object }) => {
			if (typeof elt === 'string')
				this.viewer.loadExtension(elt);
			else
				this.viewer.loadExtension(elt.id, elt.options);
		});
	}

	protected async addViewable(urn: string, xform?: THREE.Matrix4, offset?: THREE.Vector3, ids?: number[]): Promise<Autodesk.Viewing.Model> {
		const self = this;
		return (new Promise(function (resolve, reject) {
			const onDocumentLoadSuccess = (doc: Autodesk.Viewing.Document) => {
				self.documents[urn.replace('urn:', '')] = doc;
				const viewable = doc.getRoot().getDefaultGeometry();
				let options: { preserveView: Boolean, keepCurrentModels: Boolean, placementTransform?: THREE.Matrix4, globalOffset?: THREE.Vector3, ids?: number[] } = {
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
			const onDocumentLoadFailure = (code: any) => {
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
		const darkmode: Boolean =
			localStorage.getItem('darkSwitch') !== null &&
			localStorage.getItem('darkSwitch') === 'dark';

		this.viewer.setLightPreset(0);
		this.viewer.setLightPreset(darkmode ? 2 : 6);

		if (this.darkmode)
			return;
		const self = this;
		this.darkmode = new MutationObserver((mutationsList, observer) => {
			//console.log(mutationsList, observer);
			for (const mutation of mutationsList) {
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
			.then((response: any) => {
				if (!response.ok)
					throw new Error(response.statusText)
				//return (response.text());
				return (response.json());
			})
			//.then((bearer) => onGetAccessToken(bearer, 3599));
			.then((bearer) => onGetAccessToken(bearer.access_token, bearer.expires_in));
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
	// MODEL_ROOT_LOADED_EVENT
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

	public onGeometryLoaded(event?: any) { }
	public onObjectTreeCreated(tree: Autodesk.Viewing.InstanceTree, event?: any) { }
	public onToolbarCreated(event?: any) { }
	private onModelAddedInternal(modelInfo: { model: Autodesk.Viewing.Model, isOverlay: boolean, preserveTools?: any, target: Autodesk.Viewing.GuiViewer3D, type: string }) {
		this.models.push(modelInfo.model);
		this.onModelAdded(modelInfo);
	}
	public onModelAdded(modelInfo: { model: Autodesk.Viewing.Model, isOverlay: boolean, preserveTools?: any, target: Autodesk.Viewing.GuiViewer3D, type: string }) { }
	private onModelRemovedInternal(modelInfo: { model: Autodesk.Viewing.Model, target: Autodesk.Viewing.GuiViewer3D, type: string }) {
		const lastModelRemoved = !this.viewer.getVisibleModels().length;
		this.models = this.models.filter((elt: Autodesk.Viewing.Model) => elt !== modelInfo.model);
		this.onModelRemoved(modelInfo);
	}
	public onModelRemoved(modelInfo: { model: Autodesk.Viewing.Model, target: Autodesk.Viewing.GuiViewer3D, type: string }) { }
	public onModelRootLoaded(event?: any) { }
	public onExtensionActivated(event?: any) { }
	public onExtensionDeactivated(event?: any) { }
	public onExtensionLoaded(event?: any) { }
	public onExtensionPreActivated(event?: any) { }
	public onExtensionPreDeactivated(event?: any) { }
	public onExtensionPreLoaded(event?: any) { }
	public onExtensionPreUnloaded(event?: any) { }
	public onExtensionUnloaded(event?: any) { }
	public onPrefChanged(event?: any) { }

	// Utilities ( https://github.com/petrbroz/forge-viewer-utils/blob/develop/src/Utilities.js )

	private throwObjectTreeError(errorCode: number, errorMsg: string, statusCode: number, statusText: string) { throw new Error(errorMsg); };

	/**
	 * Finds all scene objects on specific X,Y position on the canvas.
	 * @param {number} x X-coordinate, i.e., horizontal distance (in pixels) from the left border of the canvas.
	 * @param {number} y Y-coordinate, i.e., vertical distance (in pixels) from the top border of the canvas.
	 * @returns {Intersection[]} List of intersections.
	 * 
	 * @example
	 * document.getElementById('viewer').addEventListener('click', function(ev) {
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
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, function() {
	 *   try {
	 *     utils.enumerateNodes(function(id) {
	 *       console.log('Found node', id);
	 *     });
	 *   } catch(err) {
	 *     console.error('Could not enumerate nodes', err);
	 *   }
	 * });
	 */
	public enumerateNodes(callback: NodeCallback, recursive: boolean = true, parentId?: number): void {
		const proceed = (tree: Autodesk.Viewing.InstanceTree) => {
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
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async function() {
	 *   const ids = await utils.listNodes();
	 *   console.log('Object IDs', ids);
	 * });
	 */
	public listNodes(recursive: boolean = true, parentId?: number): Promise<number[]> {
		const viewer = this.viewer;
		return (new Promise((resolve, reject) => {
			const proceed = (tree: Autodesk.Viewing.InstanceTree) => {
				if (typeof parentId === 'undefined')
					parentId = tree.getRootId();
				let ids: number[] = [];
				tree.enumNodeChildren(parentId, (id: number) => { ids.push(id); }, recursive);
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
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, function() {
	 *   try {
	 *     utils.enumerateLeafNodes(function(id) {
	 *       console.log('Found leaf node', id);
	 *     });
	 *   } catch(err) {
	 *     console.error('Could not enumerate nodes', err);
	 *   }
	 * });
	 */
	public enumerateLeafNodes(callback: NodeCallback, recursive: boolean = true, parentId?: number): void {
		const proceed = (tree: Autodesk.Viewing.InstanceTree) => {
			if (typeof parentId === 'undefined')
				parentId = tree.getRootId();
			tree.enumNodeChildren(
				parentId,
				(id: number) => { if (tree.getChildCount(id) === 0) callback(id); },
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
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async function() {
	 *   const ids = await utils.listLeafNodes();
	 *   console.log('Leaf object IDs', ids);
	 * });
	 */
	public listLeafNodes(recursive: boolean = true, parentId?: number): Promise<number[]> {
		const viewer = this.viewer;
		return (new Promise(function (resolve, reject) {
			const proceed = (tree: Autodesk.Viewing.InstanceTree) => {
				if (typeof parentId === 'undefined')
					parentId = tree.getRootId();
				let ids: number[] = [];
				tree.enumNodeChildren(
					parentId,
					(id: number) => { if (tree.getChildCount(id) === 0) ids.push(id); },
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
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, function() {
	 *   try {
	 *     utils.enumerateFragments(function(id) {
	 *       console.log('Found fragment', id);
	 *     });
	 *   } catch(err) {
	 *     console.error('Could not enumerate fragments', err);
	 *   }
	 * });
	 */
	public enumerateFragments(callback: FragmentCallback, recursive: boolean = true, parentId?: number): void {
		const proceed = (tree: Autodesk.Viewing.InstanceTree) => {
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
	 * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async function() {
	 *   const ids = await utils.listFragments();
	 *   console.log('Fragment IDs', ids);
	 * });
	 */
	public listFragments(recursive: boolean = true, parentId?: number): Promise<number[]> {
		const viewer = this.viewer;
		return (new Promise(function (resolve, reject) {
			const proceed = (tree: Autodesk.Viewing.InstanceTree) => {
				if (typeof parentId === 'undefined')
					parentId = tree.getRootId();
				let ids: number[] = [];
				tree.enumNodeFragments(parentId, (id) => { ids.push(id); }, recursive);
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
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function() {
	 *     const transform = utils.getFragmentOrigTransform(fragId);
	 *     console.log('Original fragment transform', transform);
	 * });
	 */
	public getFragmentOrigTransform(model: Autodesk.Viewing.Model, fragId: number, transform: THREE.Matrix4 = null): THREE.Matrix4 {
		// if (!this.viewer.model)
		// 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');

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
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function() {
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
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function() {
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
	 * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function() {
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