"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
;
function isURN_Config(object) {
    return ('urn' in object);
}
/*export*/ var SelectionType;
(function (SelectionType) {
    SelectionType[SelectionType["MIXED"] = 1] = "MIXED";
    SelectionType[SelectionType["REGULAR"] = 2] = "REGULAR";
    SelectionType[SelectionType["OVERLAYED"] = 3] = "OVERLAYED";
})(SelectionType || (SelectionType = {}));
;
;
;
var LocalViewer = /** @class */ (function () {
    /**
     *
     * @param div {HTMLElement|string} Point to the HTML element hosting the viewer
     * @param urn {string|URN_Config|(string|URN_Config)[]} Base64 encoded string pointing to the resource(s) to load. All URN should come from the same region and be of the same resource type.
     * @param getAccessToken {Function|string} Function or endpoint URL to get teh bearer token
     * @param region {Region?} (Optional) Region in which the resource is located. Defaults to US. Possible values are US | EMEA
     * @param endpoint {string?} (Optional) When using OTG|SVF2 with a local server, provide the endpoint to use to access the OTG|SVF2 CDN server
     */
    function LocalViewer(div, urn, getAccessToken, region, endpoint) {
        this.proxy = null;
        this.viewer = null;
        this.configuration = null;
        this.extensions = null;
        this.documents = {};
        this.models = null;
        this.startAt = null;
        this.darkmode = null;
        this.div = div;
        var temp = Array.isArray(urn) ? urn : [urn];
        this.urn = temp.map(function (elt) { return typeof elt === 'string' ? { urn: elt } : (isURN_Config(elt) ? elt : null); });
        this.urn = this.urn.filter(function (elt) { return elt !== null; });
        this.getAccessToken = getAccessToken;
        this.region = region || 'US';
        this.endpoint = endpoint || '';
        // BIM360 override
        if (this.region === 'US' // this is the default value
            && atob(this.urn[0].urn.replace('_', '/').replace('-', '+')).indexOf('emea') > -1)
            this.region = 'EMEA';
    }
    LocalViewer.prototype.loadExtensions = function (extensions) {
        this.extensions = extensions;
    };
    LocalViewer.prototype.enableWorkersDebugging = function () {
        Autodesk.Viewing.Private.ENABLE_INLINE_WORKER = false;
    };
    LocalViewer.prototype.run = function (config) {
        if (config === void 0) { config = 'svf'; }
        this.configuration = this.options(config);
        //Autodesk.Viewing.Private.ENABLE_INLINE_WORKER = false;
        Autodesk.Viewing.Initializer(this.configuration, this.loadModels.bind(this));
    };
    LocalViewer.prototype.loadModels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var self, jobs, models;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        self = this;
                        // Autodesk.Viewing.Private.ENABLE_DEBUG =true;
                        // Autodesk.Viewing.Private.ENABLE_INLINE_WORKER =false;
                        this.viewer = new Autodesk.Viewing.GuiViewer3D(typeof this.div === 'string' ?
                            document.getElementById(this.div)
                            : this.div, this.configuration);
                        this.viewer.start();
                        // Attach event handlers (this would work for all the files except those that doesn't have geometry data).
                        this.viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (event) {
                            //this.viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, arguments.callee);
                            self.viewer.fitToView(undefined, undefined, true);
                            setTimeout(function () {
                                self.viewer.autocam.setHomeViewFrom(_this.viewer.navigation.getCamera());
                            }, 1000);
                            var endAt = (new Date().getTime() - _this.startAt.getTime()) / 1000;
                            console.log("GEOMETRY_LOADED_EVENT => " + endAt);
                            self.onGeometryLoaded(event);
                        });
                        this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, function (event) {
                            var tree = self.viewer.model.getInstanceTree();
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
                        jobs = this.urn.map(function (elt) { return _this.addViewable(elt.urn, elt.xform, elt.offset, elt.ids); });
                        return [4 /*yield*/, Promise.all(jobs)];
                    case 1:
                        models = _a.sent();
                        this.onModelsLoaded(models);
                        this.viewer.addEventListener(Autodesk.Viewing.MODEL_ADDED_EVENT, self.onModelAddedInternal.bind(self));
                        this.viewer.addEventListener(Autodesk.Viewing.MODEL_REMOVED_EVENT, self.onModelRemovedInternal.bind(self));
                        // Load extensions
                        this.extensions.map(function (elt) {
                            if (typeof elt === 'string')
                                _this.viewer.loadExtension(elt);
                            else
                                _this.viewer.loadExtension(elt.id, elt.options);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    LocalViewer.prototype.addViewable = function (urn, xform, offset, ids) {
        return __awaiter(this, void 0, void 0, function () {
            var self;
            return __generator(this, function (_a) {
                self = this;
                return [2 /*return*/, (new Promise(function (resolve, reject) {
                        var onDocumentLoadSuccess = function (doc) {
                            self.documents[urn.replace('urn:', '')] = doc;
                            var viewable = doc.getRoot().getDefaultGeometry();
                            var options = {
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
                        };
                        var onDocumentLoadFailure = function (code) {
                            reject("Could not load document (" + code + ").");
                        };
                        if (!/^(urn|https?):.*$/g.test(urn) && urn[0] !== '/')
                            urn = 'urn:' + urn;
                        Autodesk.Viewing.Document.load(urn, onDocumentLoadSuccess, onDocumentLoadFailure);
                    }))];
            });
        });
    };
    LocalViewer.prototype.onModelsLoaded = function (models) {
        var endAt = (new Date().getTime() - this.startAt.getTime()) / 1000;
        console.log("(" + models.length + ") models loaded => " + endAt);
        this.models = models;
        this.switchToDarkMode();
        this.viewer.setQualityLevel(/* ambient shadows */ false, /* antialiasing */ true);
        this.viewer.setGroundShadow(false);
        this.viewer.setGroundReflection(false);
        this.viewer.setGhosting(true);
        this.viewer.setEnvMapBackground(false);
        this.viewer.setSelectionColor(new THREE.Color(0xEBB30B), /*Autodesk.Viewing.*/ SelectionType.MIXED);
        this.viewer.autocam.toPerspective();
    };
    LocalViewer.prototype.switchToDarkMode = function () {
        var darkmode = localStorage.getItem('darkSwitch') !== null &&
            localStorage.getItem('darkSwitch') === 'dark';
        this.viewer.setLightPreset(0);
        this.viewer.setLightPreset(darkmode ? 2 : 6);
        if (this.darkmode)
            return;
        var self = this;
        this.darkmode = new MutationObserver(function (mutationsList, observer) {
            //console.log(mutationsList, observer);
            for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
                var mutation = mutationsList_1[_i];
                if (mutation.type === 'attributes')
                    self.switchToDarkMode();
            }
        });
        this.darkmode.observe(document.body, { attributes: true, childList: false, subtree: false });
    };
    LocalViewer.prototype.unloadModel = function (model) {
        // The list of currently loaded models can be obtained via viewer.getVisibleModels() or viewer.getHiddenModels()
        this.viewer.unloadModel(model);
    };
    LocalViewer.prototype.setOptions = function (evt) {
        //this.viewer[evt.name](evt.checked);
    };
    LocalViewer.prototype.getAccessTokenFct = function (onGetAccessToken) {
        //onGetAccessToken('<%= access_token %>', 82000);
        var options = this;
        fetch(options.tokenURL)
            .then(function (response) {
            if (!response.ok)
                throw new Error(response.statusText);
            //return (response.text());
            return (response.json());
        })
            //.then((bearer) => onGetAccessToken(bearer, 3599));
            .then(function (bearer) { return onGetAccessToken(bearer.access_token, bearer.expires_in); });
    };
    LocalViewer.prototype.useProxy = function (path, mode) {
        if (path === void 0) { path = '/forge-proxy'; }
        if (mode === void 0) { mode = 'modelDerivativeV2'; }
        this.proxy = { path: path, mode: mode };
    };
    LocalViewer.prototype.activateProxy = function () {
        Autodesk.Viewing.endpoint.setEndpointAndApi(window.location.origin + this.proxy.path, this.proxy.mode);
    };
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
    LocalViewer.prototype.onGeometryLoaded = function (event) { };
    LocalViewer.prototype.onObjectTreeCreated = function (tree, event) { };
    LocalViewer.prototype.onToolbarCreated = function (event) { };
    LocalViewer.prototype.onModelAddedInternal = function (modelInfo) {
        this.models.push(modelInfo.model);
        this.onModelAdded(modelInfo);
    };
    LocalViewer.prototype.onModelAdded = function (modelInfo) { };
    LocalViewer.prototype.onModelRemovedInternal = function (modelInfo) {
        var lastModelRemoved = !this.viewer.getVisibleModels().length;
        this.models = this.models.filter(function (elt) { return elt !== modelInfo.model; });
        this.onModelRemoved(modelInfo);
    };
    LocalViewer.prototype.onModelRemoved = function (modelInfo) { };
    LocalViewer.prototype.onModelRootLoaded = function (event) { };
    LocalViewer.prototype.onExtensionActivated = function (event) { };
    LocalViewer.prototype.onExtensionDeactivated = function (event) { };
    LocalViewer.prototype.onExtensionLoaded = function (event) { };
    LocalViewer.prototype.onExtensionPreActivated = function (event) { };
    LocalViewer.prototype.onExtensionPreDeactivated = function (event) { };
    LocalViewer.prototype.onExtensionPreLoaded = function (event) { };
    LocalViewer.prototype.onExtensionPreUnloaded = function (event) { };
    LocalViewer.prototype.onExtensionUnloaded = function (event) { };
    LocalViewer.prototype.onPrefChanged = function (event) { };
    // Utilities ( https://github.com/petrbroz/forge-viewer-utils/blob/develop/src/Utilities.js )
    LocalViewer.prototype.throwObjectTreeError = function (errorCode, errorMsg, statusCode, statusText) { throw new Error(errorMsg); };
    ;
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
    LocalViewer.prototype.rayCast = function (x, y) {
        var intersections = [];
        this.viewer.impl.castRayViewport(this.viewer.impl.clientToViewport(x, y), false, null, null, intersections);
        return (intersections);
    };
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
    LocalViewer.prototype.enumerateNodes = function (callback, recursive, parentId) {
        if (recursive === void 0) { recursive = true; }
        var proceed = function (tree) {
            if (typeof parentId === 'undefined')
                parentId = tree.getRootId();
            tree.enumNodeChildren(parentId, callback, recursive);
        };
        this.viewer.getObjectTree(proceed, this.throwObjectTreeError);
    };
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
    LocalViewer.prototype.listNodes = function (recursive, parentId) {
        if (recursive === void 0) { recursive = true; }
        var viewer = this.viewer;
        return (new Promise(function (resolve, reject) {
            var proceed = function (tree) {
                if (typeof parentId === 'undefined')
                    parentId = tree.getRootId();
                var ids = [];
                tree.enumNodeChildren(parentId, function (id) { ids.push(id); }, recursive);
                resolve(ids);
            };
            viewer.getObjectTree(proceed, reject);
        }));
    };
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
    LocalViewer.prototype.enumerateLeafNodes = function (callback, recursive, parentId) {
        if (recursive === void 0) { recursive = true; }
        var proceed = function (tree) {
            if (typeof parentId === 'undefined')
                parentId = tree.getRootId();
            tree.enumNodeChildren(parentId, function (id) { if (tree.getChildCount(id) === 0)
                callback(id); }, recursive);
        };
        this.viewer.getObjectTree(proceed, this.throwObjectTreeError);
    };
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
    LocalViewer.prototype.listLeafNodes = function (recursive, parentId) {
        if (recursive === void 0) { recursive = true; }
        var viewer = this.viewer;
        return (new Promise(function (resolve, reject) {
            var proceed = function (tree) {
                if (typeof parentId === 'undefined')
                    parentId = tree.getRootId();
                var ids = [];
                tree.enumNodeChildren(parentId, function (id) { if (tree.getChildCount(id) === 0)
                    ids.push(id); }, recursive);
                resolve(ids);
            };
            viewer.getObjectTree(proceed, reject);
        }));
    };
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
    LocalViewer.prototype.enumerateFragments = function (callback, recursive, parentId) {
        if (recursive === void 0) { recursive = true; }
        var proceed = function (tree) {
            if (typeof parentId === 'undefined')
                parentId = tree.getRootId();
            tree.enumNodeFragments(parentId, callback, recursive);
        };
        this.viewer.getObjectTree(proceed, this.throwObjectTreeError);
    };
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
    LocalViewer.prototype.listFragments = function (recursive, parentId) {
        if (recursive === void 0) { recursive = true; }
        var viewer = this.viewer;
        return (new Promise(function (resolve, reject) {
            var proceed = function (tree) {
                if (typeof parentId === 'undefined')
                    parentId = tree.getRootId();
                var ids = [];
                tree.enumNodeFragments(parentId, function (id) { ids.push(id); }, recursive);
                resolve(ids);
            };
            viewer.getObjectTree(proceed, reject);
        }));
    };
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
    LocalViewer.prototype.getFragmentBounds = function (model, fragId, bounds) {
        if (bounds === void 0) { bounds = null; }
        // if (!this.viewer.model)
        // 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
        var frags = model.getFragmentList();
        frags.getWorldBounds(fragId, bounds || new THREE.Box3());
        return (bounds);
    };
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
    LocalViewer.prototype.getFragmentOrigTransform = function (model, fragId, transform) {
        // if (!this.viewer.model)
        // 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
        if (transform === void 0) { transform = null; }
        var frags = model.getFragmentList();
        frags.getOriginalWorldMatrix(fragId, transform || new THREE.Matrix4());
        return (transform);
    };
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
    LocalViewer.prototype.getFragmentAuxTransform = function (model, fragId, scale, rotation, position) {
        if (scale === void 0) { scale = null; }
        if (rotation === void 0) { rotation = null; }
        if (position === void 0) { position = null; }
        // if (!this.viewer.model)
        // 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
        var frags = model.getFragmentList();
        frags.getAnimTransform(fragId, scale, rotation, position);
    };
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
    LocalViewer.prototype.setFragmentAuxTransform = function (model, fragId, scale, rotation, position) {
        if (scale === void 0) { scale = null; }
        if (rotation === void 0) { rotation = null; }
        if (position === void 0) { position = null; }
        // if (!this.viewer.model)
        // 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
        var frags = model.getFragmentList();
        frags.updateAnimTransform(fragId, scale, rotation, position);
    };
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
    LocalViewer.prototype.getFragmentTransform = function (model, fragId, transform) {
        if (transform === void 0) { transform = null; }
        // if (!this.viewer.model)
        // 	throw new Error('Fragments not yet available. Wait for Autodesk.Viewing.FRAGMENTS_LOADED_EVENT event.');
        var frags = model.getFragmentList();
        frags.getWorldMatrix(fragId, transform || new THREE.Matrix4());
        return (transform);
    };
    /**
     * Re-renders entire scene, including overlay scenes. Should only be called
     * when absolutely needed, for example after updating aux. transforms
     * of multiple fragments using {@link setFragmentAuxiliaryTransform}.
     */
    LocalViewer.prototype.refresh = function () {
        this.viewer.impl.invalidate(true, true, true);
    };
    // Viewer options
    LocalViewer.prototype.options = function (config) {
        var getAccessToken = typeof this.getAccessToken === 'string' ?
            this.getAccessTokenFct
            : this.getAccessToken;
        var options = {
            svf: {
                env: 'AutodeskProduction',
                api: 'derivativeV2' + (this.region === 'EMEA' ? '_EU' : ''),
                useCookie: false,
                useCredentials: true,
                //acmSessionId: urn,
                getAccessToken: getAccessToken,
                tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
            },
            otg: {
                env: 'FluentProduction' + (this.region === 'EMEA' ? 'EU' : ''),
                api: 'fluent',
                useCookie: false,
                useCredentials: true,
                //acmSessionId: urn,
                getAccessToken: getAccessToken,
                tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
            },
            svf2: {
                env: (this.region === 'EMEA' ? 'MD20ProdEU' : 'MD20ProdUS'),
                api: 'D3S',
                //useCookie: false, // optional for Chrome browser
                //useCredentials: true,
                //acmSessionId: urn,
                getAccessToken: getAccessToken,
                tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
            },
            svf_local: {
                env: 'Local',
                getAccessToken: getAccessToken,
                tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
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
        return (options[config]);
    };
    ;
    return LocalViewer;
}());
//# sourceMappingURL=main.js.map