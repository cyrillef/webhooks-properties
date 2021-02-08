/// <reference types="forge-viewer" />
declare type Region = 'US' | 'EMEA';
declare type ResourceType = 'svf' | 'svf2' | 'otg' | 'svf_local' | 'svf2_local' | 'otg_local';
interface URN_Config {
    urn: string;
    xform?: THREE.Matrix4;
    offset?: THREE.Vector3;
    ids?: number[];
}
declare function isURN_Config(object: any): object is URN_Config;
declare enum SelectionType {
    MIXED = 1,
    REGULAR = 2,
    OVERLAYED = 3
}
/**
 * Callback function used when enumerating scene objects.
 * @callback NodeCallback
 * @param {number} id Object ID.
 */
interface NodeCallback {
    (id: number): void;
}
/**
 * Callback function used when enumerating scene fragments.
 * @callback FragmentCallback
 * @param {number} fragId Fragment ID.
 */
interface FragmentCallback {
    (fragId: number): void;
}
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
    model: Autodesk.Viewing.Model;
}
interface VisualClustersExtensionOptions {
    attribName: string;
    searchAncestors: boolean;
}
declare class LocalViewer {
    private div;
    private urn;
    private getAccessToken;
    private region;
    private endpoint;
    private proxy;
    private viewer;
    private configuration;
    private extensions;
    private documents;
    private models;
    private startAt;
    private darkmode;
    /**
     *
     * @param div {HTMLElement|string} Point to the HTML element hosting the viewer
     * @param urn {string|URN_Config|(string|URN_Config)[]} Base64 encoded string pointing to the resource(s) to load. All URN should come from the same region and be of the same resource type.
     * @param getAccessToken {Function|string} Function or endpoint URL to get teh bearer token
     * @param region {Region?} (Optional) Region in which the resource is located. Defaults to US. Possible values are US | EMEA
     * @param endpoint {string?} (Optional) When using OTG|SVF2 with a local server, provide the endpoint to use to access the OTG|SVF2 CDN server
     */
    constructor(div: HTMLElement | string, urn: string | URN_Config | (string | URN_Config)[], getAccessToken: Function | string, region?: Region, endpoint?: string);
    loadExtensions(extensions: (string | {
        id: string;
        options: object;
    })[]): void;
    enableWorkersDebugging(): void;
    run(config?: ResourceType): void;
    protected loadModels(): Promise<void>;
    protected addViewable(urn: string, xform?: THREE.Matrix4, offset?: THREE.Vector3, ids?: number[]): Promise<Autodesk.Viewing.Model>;
    protected onModelsLoaded(models: Autodesk.Viewing.Model[]): void;
    switchToDarkMode(): void;
    protected unloadModel(model: Autodesk.Viewing.Model): void;
    setOptions(evt: any): void;
    private getAccessTokenFct;
    useProxy(path?: string, mode?: string): void;
    private activateProxy;
    onGeometryLoaded(event?: any): void;
    onObjectTreeCreated(tree: Autodesk.Viewing.InstanceTree, event?: any): void;
    onToolbarCreated(event?: any): void;
    private onModelAddedInternal;
    onModelAdded(modelInfo: {
        model: Autodesk.Viewing.Model;
        isOverlay: boolean;
        preserveTools?: any;
        target: Autodesk.Viewing.GuiViewer3D;
        type: string;
    }): void;
    private onModelRemovedInternal;
    onModelRemoved(modelInfo: {
        model: Autodesk.Viewing.Model;
        target: Autodesk.Viewing.GuiViewer3D;
        type: string;
    }): void;
    onModelRootLoaded(event?: any): void;
    onExtensionActivated(event?: any): void;
    onExtensionDeactivated(event?: any): void;
    onExtensionLoaded(event?: any): void;
    onExtensionPreActivated(event?: any): void;
    onExtensionPreDeactivated(event?: any): void;
    onExtensionPreLoaded(event?: any): void;
    onExtensionPreUnloaded(event?: any): void;
    onExtensionUnloaded(event?: any): void;
    onPrefChanged(event?: any): void;
    private throwObjectTreeError;
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
    rayCast(x: number, y: number): Intersection[];
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
    enumerateNodes(callback: NodeCallback, recursive?: boolean, parentId?: number): void;
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
    listNodes(recursive?: boolean, parentId?: number): Promise<number[]>;
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
    enumerateLeafNodes(callback: NodeCallback, recursive?: boolean, parentId?: number): void;
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
    listLeafNodes(recursive?: boolean, parentId?: number): Promise<number[]>;
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
    enumerateFragments(callback: FragmentCallback, recursive?: boolean, parentId?: number): void;
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
    listFragments(recursive?: boolean, parentId?: number): Promise<number[]>;
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
    getFragmentBounds(model: Autodesk.Viewing.Model, fragId: number, bounds?: THREE.Box3): THREE.Box3;
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
    getFragmentOrigTransform(model: Autodesk.Viewing.Model, fragId: number, transform?: THREE.Matrix4): THREE.Matrix4;
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
    getFragmentAuxTransform(model: Autodesk.Viewing.Model, fragId: number, scale?: THREE.Vector3, rotation?: THREE.Quaternion, position?: THREE.Vector3): void;
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
    setFragmentAuxTransform(model: Autodesk.Viewing.Model, fragId: number, scale?: THREE.Vector3, rotation?: THREE.Quaternion, position?: THREE.Vector3): void;
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
    getFragmentTransform(model: Autodesk.Viewing.Model, fragId: number, transform?: THREE.Matrix4): THREE.Matrix4;
    /**
     * Re-renders entire scene, including overlay scenes. Should only be called
     * when absolutely needed, for example after updating aux. transforms
     * of multiple fragments using {@link setFragmentAuxiliaryTransform}.
     */
    refresh(): void;
    private options;
}
