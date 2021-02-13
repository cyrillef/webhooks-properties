/// <reference types="forge-viewer" />
declare type Region = 'US' | 'EMEA';
declare type ResourceType = 'svf' | 'svf2' | 'otg' | 'svf_local' | 'svf2_local' | 'otg_local';
interface URN_Config {
    urn: string;
    view?: Autodesk.Viewing.BubbleNodeSearchProps;
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
interface BasicInfo {
    target: Autodesk.Viewing.Viewer3D | Autodesk.Viewing.GuiViewer3D;
    type: string;
    [key: string]: any;
}
interface ModelLoadingInfo extends BasicInfo {
    model: Autodesk.Viewing.Model;
    isOverlay?: boolean;
    preserveTools?: any;
    svf: any;
}
interface ExtensionInfo extends BasicInfo {
    extensionId: string;
    mode?: MouseEvent;
}
declare enum ToolBarDockingSite {
    Left = "left",
    Right = "right",
    Top = "top",
    Bottom = "bottom"
}
interface UIToolbarDefinition {
    id?: string;
    isVertical?: boolean;
    left?: string;
    top?: string;
    bottom?: string;
    right?: string;
    docking?: ToolBarDockingSite;
    [key: string]: any;
}
declare type BistateButtonOptions = boolean | {
    iconClass?: string[] | string[][];
    buttonClass?: string[] | string[][];
};
interface UIButtonDefinition {
    id: string;
    iconClass?: string | string[];
    buttonClass?: string | string[];
    tooltip?: string;
    visible?: boolean;
    state?: Autodesk.Viewing.UI.Button.State;
    collapsible?: boolean;
    index?: number;
    children?: UIButtonDefinition[];
    bistate?: BistateButtonOptions;
    onClick?: (event: Event) => void;
    onMouseOut?: (event: Event) => void;
    onMouseOver?: (event: Event) => void;
    onVisibiltyChanged?: (event: Event) => void;
    onStateChanged?: (event: Event) => void;
    onCollapseChanged?: (event: Event) => void;
}
interface ControlEvent {
    target: Autodesk.Viewing.UI.Control;
    type: string;
    [key: string]: any;
}
declare class BistateButton extends Autodesk.Viewing.UI.Button {
    private bistateOptions;
    constructor(id?: string, options?: Autodesk.Viewing.UI.ControlOptions);
    protected onButtonClick(info: ControlEvent): void;
}
interface UIConfiguration {
    [key: string]: UIToolbarDefinition;
}
declare type UnitType = 'decimal-ft' | 'ft' | 'ft-and-decimal-in' | 'decimal-in' | 'fractional-in' | 'm' | 'cm' | 'mm' | 'm-and-cm';
interface VisualClustersExtensionOptions {
    attribName: string;
    searchAncestors: boolean;
}
interface MeasureExtensionOptions {
    units: UnitType;
    precision: number;
}
declare enum AggregateMode {
    Legacy = 0,
    Auto = 0,
    Aggregated = 1
}
interface ViewerInitializerOptions {
    webGLHelpLink?: string;
    language?: string;
    useADP?: boolean;
    useConsolidation?: boolean;
    [key: string]: any;
}
interface Viewer3DConstructorOptions {
    startOnInitialize?: boolean;
    theme?: 'dark-theme' | 'light-theme' | string;
    [key: string]: any;
}
interface ViewerConstructorOptions {
    disableBrowserContextMenu?: boolean;
    disabledExtensions?: {
        bimwalk?: boolean;
        hyperlink?: boolean;
        measure?: boolean;
        scalarisSimulation?: boolean;
        section?: boolean;
    };
    extensions?: string[];
    useConsolidation?: boolean;
    consolidationMemoryLimit?: number;
    sharedPropertyDbPath?: string;
    bubbleNode?: Autodesk.Viewing.BubbleNode;
    canvasConfig?: any;
    startOnInitialize?: boolean;
    experimental?: any[];
    theme?: 'dark-theme' | 'light-theme' | string;
    [key: string]: any;
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
    private modelBrowserExcludeRoot;
    private extensions;
    private ui_definition;
    private ui_references;
    private viewerAggregateMode;
    private documents;
    private models;
    private startAt;
    private darkmode;
    static NAVTOOLBAR: string;
    static MEASURETOOLBAR: string;
    static MODELTOOLBAR: string;
    static SETTINGSTOOLBAR: string;
    /**
     *
     * @param div {HTMLElement|string} Point to the HTML element hosting the viewer
     * @param urn {string|URN_Config|(string|URN_Config)[]} Base64 encoded string pointing to the resource(s) to load. All URN should come from the same region and be of the same resource type.
     * @param getAccessToken {Function|string} Function or endpoint URL to get teh bearer token
     * @param region {Region?} (Optional) Region in which the resource is located. Defaults to US. Possible values are US | EMEA
     * @param endpoint {string?} (Optional) When using OTG|SVF2 with a local server, provide the endpoint to use to access the OTG|SVF2 CDN server
     */
    constructor(div: HTMLElement | string, urn: string | URN_Config | (string | URN_Config)[], getAccessToken: Function | string, region?: Region, endpoint?: string);
    configureExtensions(extensions: (string | {
        id: string;
        options: any;
    })[]): void;
    private loadExtensions;
    private reconfigureExtensions;
    configureUI(ui: UIConfiguration): void;
    enableWorkersDebugging(): void;
    setModelBrowserExcludeRoot(flag?: boolean): void;
    start(config?: ResourceType): void;
    protected loadModels(): Promise<void>;
    protected addViewable(urn: string, view?: Autodesk.Viewing.BubbleNodeSearchProps, xform?: THREE.Matrix4, offset?: THREE.Vector3, ids?: number[]): Promise<Autodesk.Viewing.Model>;
    protected onModelsLoaded(models: Autodesk.Viewing.Model[]): void;
    switchToDarkMode(): void;
    protected unloadModel(model: Autodesk.Viewing.Model): void;
    setOptions(evt: any): void;
    private getAccessTokenFct;
    useProxy(path?: string, mode?: string): void;
    private activateProxy;
    onGeometryLoaded(info: ModelLoadingInfo): void;
    onObjectTreeCreated(tree: Autodesk.Viewing.InstanceTree, info: ModelLoadingInfo): void;
    private onToolbarCreatedInternal;
    onToolbarCreated(info: BasicInfo): void;
    private onModelAddedInternal;
    onModelAdded(modelInfo: ModelLoadingInfo): void;
    private onModelRemovedInternal;
    onModelRemoved(modelInfo: ModelLoadingInfo): void;
    private onModelRootLoadedInternal;
    onModelRootLoaded(modelInfo: ModelLoadingInfo): void;
    onExtensionActivatedInternal(extensionInfo: ExtensionInfo): void;
    onExtensionActivated(extensionInfo: ExtensionInfo): void;
    onExtensionDeactivated(extensionInfo: ExtensionInfo): void;
    onExtensionLoaded(extensionInfo: ExtensionInfo): void;
    onExtensionPreActivated(extensionInfo: ExtensionInfo): void;
    onExtensionPreDeactivated(extensionInfo: ExtensionInfo): void;
    onExtensionPreLoaded(extensionInfo: ExtensionInfo): void;
    onExtensionPreUnloaded(extensionInfo: ExtensionInfo): void;
    onExtensionUnloaded(extensionInfo: ExtensionInfo): void;
    onPrefChanged(event?: any): void;
    private throwObjectTreeError;
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
    rayCast(x: number, y: number): Intersection[];
    get aggregateMode(): AggregateMode;
    set aggregateMode(newAggragteMode: AggregateMode);
    /**
     * Search text in all models loaded.
     *
     * @param {string} text Text to search.
     *
     * @returns {Promise<{ model: Autodesk.Viewing.Model, dbids: number[] }[]>} Promise that will be resolved with a list of IDs per Models,
     */
    aggregateSearch(text: string): Promise<{
        model: Autodesk.Viewing.Model;
        dbids: number[];
    }[]>;
    getAggregateSelection(): {
        model: Autodesk.Viewing.Model;
        selection: number[];
    }[];
    setAggregateSelection(selection: {
        model: Autodesk.Viewing.Model;
        selection: number[];
        selectionType?: any;
    }[]): void;
    aggregateSelect(selection: {
        model: Autodesk.Viewing.Model;
        selection: number[];
        selectionType?: any;
    }[]): void;
    getAggregateIsolation(): {
        model: Autodesk.Viewing.Model;
        ids: number[];
    }[];
    setAggregateIsolation(isolateAggregate: {
        model: Autodesk.Viewing.Model;
        ids: number[];
    }[], hideLoadedModels?: boolean): void;
    aggregateIsolate(isolateAggregate: {
        model: Autodesk.Viewing.Model;
        ids: number[];
    }[], hideLoadedModels?: boolean): void;
    getAggregateHiddenNodes(): {
        model: Autodesk.Viewing.Model;
        ids: number[];
    }[];
    setAggregateHiddenNodes(hideAggregate: {
        model: Autodesk.Viewing.Model;
        ids: number[];
    }[]): void;
    aggregateHide(hideAggregate: {
        model: Autodesk.Viewing.Model;
        ids: number[];
    }[]): void;
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
     * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
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
     * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
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
     * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
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
    getToolbar(id?: string): Autodesk.Viewing.UI.ToolBar;
    protected createToolbar(id: string, def: UIToolbarDefinition): Autodesk.Viewing.UI.ToolBar;
    getGroupCtrl(tb: Autodesk.Viewing.UI.ToolBar, id: string): Autodesk.Viewing.UI.ControlGroup;
    protected createControlGroup(viewerToolbar: Autodesk.Viewing.UI.ToolBar, groupName: string): Autodesk.Viewing.UI.ControlGroup;
    protected createRadioButtonGroup(viewerToolbar: Autodesk.Viewing.UI.ToolBar, groupName: string): Autodesk.Viewing.UI.RadioButtonGroup;
    protected createButton(id: string, def: UIButtonDefinition): Autodesk.Viewing.UI.Button;
    protected createButtonInGroup(groupCtrl: Autodesk.Viewing.UI.ControlGroup, id: string, def: UIButtonDefinition): Autodesk.Viewing.UI.Button;
    protected assignComboButton(combo: Autodesk.Viewing.UI.ComboButton, button: Autodesk.Viewing.UI.Button): void;
    protected onClickComboChild(evt: Event): void;
    getUI(): string[];
    getControls(searchpath: string | string[]): Autodesk.Viewing.UI.Control[];
    getControl(idpath: string): Autodesk.Viewing.UI.Control;
    protected _dumb_(evt: Event): void;
    buildUI(ui_definition: UIConfiguration): Autodesk.Viewing.UI.ToolBar[];
    moveCtrl(ctrl: string | Autodesk.Viewing.UI.Control, parent: string | Autodesk.Viewing.UI.ControlGroup | Autodesk.Viewing.UI.ToolBar, options?: Autodesk.Viewing.UI.AddControlOptions): void;
    moveToolBar(tb?: string | Autodesk.Viewing.UI.ToolBar, docking?: ToolBarDockingSite, offset?: string): void;
    private options;
}
