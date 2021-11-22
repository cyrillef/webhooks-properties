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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
function isModelURN(object) {
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
var ToolBarDockingSite;
(function (ToolBarDockingSite) {
    ToolBarDockingSite["Left"] = "left";
    ToolBarDockingSite["Right"] = "right";
    ToolBarDockingSite["Top"] = "top";
    ToolBarDockingSite["Bottom"] = "bottom";
})(ToolBarDockingSite || (ToolBarDockingSite = {}));
var BistateButton = /** @class */ (function (_super) {
    __extends(BistateButton, _super);
    function BistateButton(id, options) {
        var _this = _super.call(this, id, options) || this;
        _this.bistateOptions = options.bistate;
        if (_this.bistateOptions.iconClass && typeof (_this.bistateOptions.iconClass[0]) === 'string')
            _this.bistateOptions.iconClass = _this.bistateOptions.iconClass.map(function (st) { return ([st]); });
        if (_this.bistateOptions.buttonClass && typeof (_this.bistateOptions.buttonClass[0]) === 'string')
            _this.bistateOptions.buttonClass = _this.bistateOptions.buttonClass.map(function (st) { return ([st]); });
        _this.addEventListener('click', _this.onButtonClick.bind(_this));
        return _this;
    }
    BistateButton.prototype.onButtonClick = function (info) {
        var button = info.target;
        var oldState = button.getState();
        button.setState(button.getState() ? Autodesk.Viewing.UI.Button.State.ACTIVE : Autodesk.Viewing.UI.Button.State.INACTIVE);
        if (typeof this.bistateOptions !== 'object')
            return;
        if (this.bistateOptions.iconClass) {
            this.bistateOptions.iconClass[oldState].forEach(function (element) { return button.icon.classList.remove(element); });
            this.bistateOptions.iconClass[button.getState()].forEach(function (element) { return button.icon.classList.add(element); });
        }
        if (this.bistateOptions.buttonClass) {
            this.bistateOptions.buttonClass[oldState].forEach(function (element) { return button.container.classList.remove(element); });
            this.bistateOptions.buttonClass[button.getState()].forEach(function (element) { return button.container.classList.add(element); });
        }
    };
    return BistateButton;
}(Autodesk.Viewing.UI.Button));
var AggregateMode;
(function (AggregateMode) {
    AggregateMode[AggregateMode["Legacy"] = 0] = "Legacy";
    AggregateMode[AggregateMode["Auto"] = 0] = "Auto";
    AggregateMode[AggregateMode["Aggregated"] = 1] = "Aggregated";
})(AggregateMode || (AggregateMode = {}));
// #endregion
// #region ForgeViewer
var ForgeViewer = /** @class */ (function () {
    // #endregion
    // #region Constructor
    /**
     *
     * @param div {HTMLElement|string} Point to the HTML element hosting the viewer
     * @param urn {string|URN_Config|(string|URN_Config)[]} Base64 encoded string pointing to the resource(s) to load. All URN should come from the same region and be of the same resource type.
     * @param getAccessToken {Function|string} Function or endpoint URL to get teh bearer token
     * @param region {Region?} (Optional) Region in which the resource is located. Defaults to US. Possible values are US | EMEA
     * @param endpoint {string?} (Optional) When using OTG|SVF2 with a local server, provide the endpoint to use to access the OTG|SVF2 CDN server
     */
    function ForgeViewer(div, urn, getAccessToken, endpoint) {
        this.proxy = null;
        this.viewer = null;
        this.configuration = null;
        this.modelBrowserExcludeRoot = true;
        this.extensions = null;
        this.disabledExtensions = null;
        this.ui_definition = null;
        this.ui_references = {};
        this.ui_handlers = null;
        this.viewerAggregateMode = AggregateMode.Auto;
        this.documents = {};
        this.models = null;
        this.startAt = null;
        this.darkmode = null; // dark-theme, light-theme, bim-theme, acs-theme
        this.div = div;
        var temp = Array.isArray(urn) ? urn : [urn];
        this.urns = temp.map(function (elt) { return typeof elt === 'string' ? { urn: elt } : (isModelURN(elt) ? elt : null); });
        this.urns = this.urns.filter(function (elt) { return elt !== null; });
        this.getAccessToken = getAccessToken;
        this.endpoint = endpoint || '';
        // Assign Region and BIM360 override
        this.urns = this.urns.map(function (elt) {
            if (atob(elt.urn.replace('_', '/').replace('-', '+')).indexOf('emea') > -1)
                elt.region = 'EMEA';
            else
                elt.region = elt.region || 'US';
            if (Array.isArray(elt.xform))
                elt.xform = (new THREE.Matrix4()).makeScale(elt.xform[0], elt.xform[1], elt.xform[2]);
            else if (typeof elt.xform === 'number')
                elt.xform = (new THREE.Matrix4()).makeScale(elt.xform, elt.xform, elt.xform);
            if (Array.isArray(elt.offset))
                elt.offset = new THREE.Vector3(elt.offset[0], elt.offset[1], elt.offset[2]);
            else if (typeof elt.offset === 'number')
                elt.offset = new THREE.Vector3(elt.offset, elt.offset, elt.offset);
            return (elt);
        });
    }
    // #endregion
    // #region Viewer Configuration
    ForgeViewer.prototype.configureExtensions = function (extensions, disabledExtensions) {
        this.extensions = extensions;
        this.disabledExtensions = disabledExtensions || {};
    };
    ForgeViewer.prototype.loadExtensions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var self, res, _a, ex_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        self = this;
                        if (!(typeof this.extensions === 'string')) return [3 /*break*/, 5];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(this.extensions)];
                    case 2:
                        res = _b.sent();
                        _a = this;
                        return [4 /*yield*/, res.json()];
                    case 3:
                        _a.extensions = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        ex_1 = _b.sent();
                        console.error(ex_1);
                        return [3 /*break*/, 5];
                    case 5:
                        this.extensions.map(function (elt) {
                            if (typeof elt === 'string') {
                                var pr = self.viewer.loadExtension(elt);
                                // pr
                                // 	.then((ext: Autodesk.Extensions.Measure.MeasureExtension): void => { ext.activate(''); })
                                // 	.catch((reason: any): void => { });
                            }
                            else {
                                switch (elt.id) {
                                    case 'Autodesk.Debug': {
                                        //(Autodesk.Viewing.Extensions as any).Debug.DEFAULT_DEBUG_URL = elt.options.DEFAULT_DEBUG_URL;
                                        if (elt.options && elt.options.DEFAULT_DEBUG_URL)
                                            Autodesk.Viewing.Private.LocalStorage.setItem('lmv_debug_host', elt.options.DEFAULT_DEBUG_URL);
                                    }
                                }
                                var pr = self.viewer.loadExtension(elt.id, elt.options);
                                switch (elt.id) {
                                    case 'Autodesk.Measure': {
                                        pr
                                            .then(function (ext) {
                                            ext.setUnits(elt.options.units);
                                            ext.setPrecision(elt.options.precision);
                                        })
                                            .catch(function (reason) { });
                                    }
                                    // case 'Autodesk.Debug': {
                                    // 	pr
                                    // 		.then((ext: any): void => {
                                    // 			//(Autodesk.Viewing.Extensions as any).Debug.DEFAULT_DEBUG_URL = elt.options.DEFAULT_DEBUG_URL;
                                    // 			if (elt.options && elt.options.DEFAULT_DEBUG_URL)
                                    // 				Autodesk.Viewing.Private.LocalStorage.setItem('lmv_debug_host', elt.options.DEFAULT_DEBUG_URL);
                                    // 		})
                                    // 		.catch((reason: any): void => { });
                                    // }
                                }
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    ForgeViewer.prototype.reconfigureExtensions = function (extensionInfo) {
        if (extensionInfo && extensionInfo.extensionId !== 'Autodesk.Measure')
            return;
        var result = this.extensions.filter(function (elt) { return typeof elt !== 'string' && elt.id === 'Autodesk.Measure'; });
        if (result && result.length === 1) {
            var ext = this.viewer.getExtension('Autodesk.Measure');
            if (!ext)
                return;
            var extOptions = result[0];
            //setTimeout((): void => { // Let a change to the extension code to cope with default behavior
            ext.setUnits(extOptions.options.units);
            ext.setPrecision(extOptions.options.precision);
            //}, 1000);
        }
    };
    ForgeViewer.prototype.configureUI = function (ui, uiHandlers) {
        return __awaiter(this, void 0, void 0, function () {
            var res, _a, ex_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(typeof ui === 'string')) return [3 /*break*/, 6];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(ui)];
                    case 2:
                        res = _b.sent();
                        _a = this;
                        return [4 /*yield*/, res.json()];
                    case 3:
                        _a.ui_definition = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        ex_2 = _b.sent();
                        console.error(ex_2);
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        this.ui_definition = ui;
                        _b.label = 7;
                    case 7:
                        if (uiHandlers)
                            this.ui_handlers = uiHandlers;
                        return [2 /*return*/];
                }
            });
        });
    };
    ForgeViewer.prototype.enableWorkersDebugging = function () {
        Autodesk.Viewing.Private.ENABLE_INLINE_WORKER = false;
    };
    ForgeViewer.prototype.setModelBrowserExcludeRoot = function (flag) {
        if (flag === void 0) { flag = true; }
        this.modelBrowserExcludeRoot = flag;
    };
    ForgeViewer.prototype.setOptions = function (evt) {
        //this.viewer[evt.name](evt.checked);
    };
    // #endregion
    // #region Start / Loading
    ForgeViewer.prototype.start = function (config, enableInlineWorker) {
        if (config === void 0) { config = 'svf'; }
        var region = this.urns && this.urns.length > 0 ? this.urns[0].region || 'US' : 'US';
        this.configuration = this.options(config, region);
        //(Autodesk.Viewing.Private as any).ENABLE_DEBUG = true;
        Autodesk.Viewing.Private.ENABLE_INLINE_WORKER = enableInlineWorker ? enableInlineWorker : true;
        Autodesk.Viewing.Initializer(this.configuration, this.loadModels.bind(this));
    };
    ForgeViewer.prototype.loadModels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var self, darkmode, jobs, models;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        self = this;
                        darkmode = localStorage.getItem('darkSwitch') !== null &&
                            localStorage.getItem('darkSwitch') === 'dark';
                        this.configuration.theme = darkmode ? 'dark-theme' : 'bim-theme';
                        this.configuration.disabledExtensions = this.disabledExtensions;
                        //(Autodesk.Viewing.Private as any).ENABLE_DEBUG =true;
                        //(Autodesk.Viewing.Private as any).ENABLE_INLINE_WORKER =false;
                        this.configuration.modelBrowserExcludeRoot = this.modelBrowserExcludeRoot;
                        this.viewer = new Autodesk.Viewing.GuiViewer3D(typeof this.div === 'string' ?
                            document.getElementById(this.div)
                            : this.div, this.configuration);
                        this.viewer._viewerController_ = this;
                        this.viewer.start();
                        if (darkmode) {
                            setTimeout(function () {
                                var ctx = self.viewer.canvas.getContext('webgl2');
                                ctx.clearColor(0.199, 0.199, 0.199, 1);
                                ctx.clear(ctx.COLOR_BUFFER_BIT);
                            }, 200);
                        }
                        // Attach event handlers (this would work for all the files except those that doesn't have geometry data).
                        this.viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (info) {
                            //this.viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, arguments.callee);
                            info.target.fitToView(undefined, undefined, true);
                            setTimeout(function () {
                                info.target.autocam.setHomeViewFrom(info.target.navigation.getCamera());
                            }, 1000);
                            var endAt = (new Date().getTime() - self.startAt.getTime()) / 1000;
                            console.log("GEOMETRY_LOADED_EVENT => " + endAt);
                            self.onGeometryLoaded(info);
                        });
                        this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, function (info) {
                            var tree = info.model.getInstanceTree();
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
                        jobs = this.urns.map(function (elt) { return _this.addViewable(elt.urn, elt.view, elt.xform, elt.offset, elt.ids); });
                        return [4 /*yield*/, Promise.all(jobs)];
                    case 1:
                        models = _a.sent();
                        this.onModelsLoaded(models);
                        this.viewer.addEventListener(Autodesk.Viewing.MODEL_ADDED_EVENT, self.onModelAddedInternal.bind(self));
                        this.viewer.addEventListener(Autodesk.Viewing.MODEL_REMOVED_EVENT, self.onModelRemovedInternal.bind(self));
                        this.viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, self.onModelRootLoadedInternal.bind(self));
                        // Load extensions
                        this.loadExtensions();
                        return [2 /*return*/];
                }
            });
        });
    };
    ForgeViewer.prototype.addViewable = function (urn, view, xform, offset, ids) {
        return __awaiter(this, void 0, void 0, function () {
            var self;
            return __generator(this, function (_a) {
                self = this;
                return [2 /*return*/, (new Promise(function (resolve, reject) {
                        var onDocumentLoadSuccess = function (doc) {
                            doc.downloadAecModelData() // https://forge.autodesk.com/blog/add-revit-levels-and-2d-minimap-your-3d
                                // this.viewer.model.getDocumentNode().getAecModelData()
                                // .then((data: any): void => { (doc as any).aecData = data; })
                                // .catch((reason: any): void => { (doc as any).aecData = null; });
                                .catch(function (reason) { });
                            self.documents[urn.replace('urn:', '')] = doc;
                            var viewable = view ?
                                doc.getRoot().search(view)[0]
                                : doc.getRoot().getDefaultGeometry();
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
    ForgeViewer.prototype.onModelsLoaded = function (models) {
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
    ForgeViewer.prototype.switchToDarkMode = function () {
        var darkmode = localStorage.getItem('darkSwitch') !== null &&
            localStorage.getItem('darkSwitch') === 'dark';
        this.viewer.setLightPreset(0);
        this.viewer.setLightPreset(darkmode ? 2 : 6);
        this.viewer.container.classList.remove('dark-theme');
        this.viewer.container.classList.remove('bim-theme');
        this.viewer.container.classList.add(darkmode ? 'dark-theme' : 'bim-theme');
        if (this.darkmode)
            return;
        var self = this;
        this.darkmode = new MutationObserver(function (mutations, observer) {
            //console.log(mutationsList, observer);
            for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
                var mutation = mutations_1[_i];
                if (mutation.type === 'attributes')
                    self.switchToDarkMode();
            }
        });
        this.darkmode.observe(document.body, { attributes: true, childList: false, subtree: false });
    };
    ForgeViewer.prototype.unloadModel = function (model) {
        // The list of currently loaded models can be obtained via viewer.getVisibleModels() or viewer.getHiddenModels()
        this.viewer.unloadModel(model);
    };
    // #endregion
    // #region OAuth / Proxy
    ForgeViewer.prototype.getAccessTokenFct = function (onGetAccessToken) {
        //onGetAccessToken('<%= access_token %>', 82000);
        var options = this;
        fetch(options.tokenURL)
            .then(function (response) {
            if (!response.ok)
                throw new Error(response.statusText);
            return (response.json());
        })
            .then(function (bearer) { return onGetAccessToken(bearer.access_token, bearer.expires_in); });
    };
    ForgeViewer.prototype.useProxy = function (path, mode) {
        if (path === void 0) { path = '/forge-proxy'; }
        if (mode === void 0) { mode = 'modelDerivativeV2'; }
        this.proxy = { path: path, mode: mode };
    };
    ForgeViewer.prototype.activateProxy = function () {
        Autodesk.Viewing.endpoint.setEndpointAndApi(window.location.origin + this.proxy.path, this.proxy.mode);
    };
    // #endregion
    // #region Events
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
    ForgeViewer.prototype.onGeometryLoaded = function (info) { };
    ForgeViewer.prototype.onObjectTreeCreated = function (tree, info) { };
    ForgeViewer.prototype.onToolbarCreatedInternal = function (info) {
        var toolbars = this.buildUI(this.ui_definition, this.ui_handlers);
        this.onToolbarCreated(__assign(__assign({}, info), { toolbars: toolbars }));
    };
    ForgeViewer.prototype.onToolbarCreated = function (info) { };
    ForgeViewer.prototype.onModelAddedInternal = function (modelInfo) {
        this.models.push(modelInfo.model);
        this.onModelAdded(modelInfo);
    };
    ForgeViewer.prototype.onModelAdded = function (modelInfo) { };
    ForgeViewer.prototype.onModelRemovedInternal = function (modelInfo) {
        var lastModelRemoved = !this.viewer.getVisibleModels().length;
        this.models = this.models.filter(function (elt) { return elt !== modelInfo.model; });
        this.onModelRemoved(modelInfo);
    };
    ForgeViewer.prototype.onModelRemoved = function (modelInfo) { };
    ForgeViewer.prototype.onModelRootLoadedInternal = function (modelInfo) {
        //this.reconfigureExtensions();
        this.onModelRootLoaded(modelInfo);
    };
    ForgeViewer.prototype.onModelRootLoaded = function (modelInfo) { };
    ForgeViewer.prototype.onExtensionActivatedInternal = function (extensionInfo) {
        this.reconfigureExtensions(extensionInfo);
        this.onExtensionActivated(extensionInfo);
    };
    ForgeViewer.prototype.onExtensionActivated = function (extensionInfo) { };
    ForgeViewer.prototype.onExtensionDeactivated = function (extensionInfo) { };
    ForgeViewer.prototype.onExtensionLoaded = function (extensionInfo) { };
    ForgeViewer.prototype.onExtensionPreActivated = function (extensionInfo) { };
    ForgeViewer.prototype.onExtensionPreDeactivated = function (extensionInfo) { };
    ForgeViewer.prototype.onExtensionPreLoaded = function (extensionInfo) { };
    ForgeViewer.prototype.onExtensionPreUnloaded = function (extensionInfo) { };
    ForgeViewer.prototype.onExtensionUnloaded = function (extensionInfo) { };
    ForgeViewer.prototype.onPrefChanged = function (event) { };
    // #endregion
    // #region Utilities ( https://github.com/petrbroz/forge-viewer-utils/blob/develop/src/Utilities.js )
    ForgeViewer.prototype.throwObjectTreeError = function (errorCode, errorMsg, statusCode, statusText) { throw new Error(errorMsg); };
    ;
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
    ForgeViewer.prototype.rayCast = function (x, y) {
        var intersections = [];
        this.viewer.impl.castRayViewport(this.viewer.impl.clientToViewport(x, y), false, null, null, intersections);
        return (intersections);
    };
    Object.defineProperty(ForgeViewer.prototype, "aggregateMode", {
        // #region Aggregate - Multi-Model utilities
        get: function () { return (this.viewerAggregateMode); },
        set: function (newAggragteMode) { this.viewerAggregateMode = newAggragteMode; },
        enumerable: false,
        configurable: true
    });
    /**
     * Search text in all models loaded.
     *
     * @param {string} text Text to search.
     *
     * @returns {Promise<{ model: Autodesk.Viewing.Model, dbids: number[] }[]>} Promise that will be resolved with a list of IDs per Models,
     */
    ForgeViewer.prototype.aggregateSearch = function (text) {
        var viewer = this.viewer;
        return (new Promise(function (resolve, reject) {
            var results = [];
            var models = viewer.getVisibleModels();
            models.forEach(function (model) {
                model.search(text, function (dbids) {
                    results.push({ model: model, dbids: dbids });
                    if (results.length === models.length)
                        resolve(results);
                }, function (err) { return reject(err); });
            });
        }));
    };
    ForgeViewer.prototype.getAggregateSelection = function () {
        return (this.viewer.getAggregateSelection());
    };
    ForgeViewer.prototype.setAggregateSelection = function (selection) {
        var ss = selection.map(function (elt) {
            if (elt.selection && !elt.ids) {
                elt.ids = elt.selection;
                delete elt.selection;
            }
            return (elt);
        });
        this.viewer.impl.selector.setAggregateSelection(ss);
    };
    ForgeViewer.prototype.aggregateSelect = function (selection) {
        this.setAggregateSelection(selection);
    };
    ForgeViewer.prototype.getAggregateIsolation = function () {
        return (this.viewer.getAggregateIsolation());
    };
    ForgeViewer.prototype.setAggregateIsolation = function (isolateAggregate, hideLoadedModels) {
        if (hideLoadedModels === void 0) { hideLoadedModels = false; }
        this.viewer.impl.visibilityManager.aggregateIsolate(isolateAggregate, { hideLoadedModels: hideLoadedModels });
    };
    ForgeViewer.prototype.aggregateIsolate = function (isolateAggregate, hideLoadedModels) {
        if (hideLoadedModels === void 0) { hideLoadedModels = false; }
        this.setAggregateIsolation(isolateAggregate, hideLoadedModels);
    };
    ForgeViewer.prototype.getAggregateHiddenNodes = function () {
        return (this.viewer.getAggregateHiddenNodes());
    };
    ForgeViewer.prototype.setAggregateHiddenNodes = function (hideAggregate) {
        this.viewer.impl.visibilityManager.aggregateHide(hideAggregate);
    };
    ForgeViewer.prototype.aggregateHide = function (hideAggregate) {
        this.setAggregateHiddenNodes(hideAggregate);
    };
    // #endregion
    // #region Injection
    // https://github.com/petrbroz/forge-basic-app/blob/custom-shader-material/public/HeatmapExtension.js
    ForgeViewer.prototype.injectShaderMaterial = function (materialName, shaderDefinition, supportsMrtNormals, skipSimplPhongHeuristics) {
        if (supportsMrtNormals === void 0) { supportsMrtNormals = true; }
        if (skipSimplPhongHeuristics === void 0) { skipSimplPhongHeuristics = true; }
        //https://github.com/petrbroz/forge-basic-app/blob/custom-shader-material/public/HeatmapExtension.js
        var customMaterial = new THREE.ShaderMaterial(shaderDefinition);
        customMaterial.side = THREE.DoubleSide;
        customMaterial.supportsMrtNormals = supportsMrtNormals;
        this.viewer.impl.matman().addMaterial(materialName, customMaterial, skipSimplPhongHeuristics);
        return (customMaterial);
    };
    ForgeViewer.prototype.injectPhongMaterial = function (materialName, phongDefinition, supportsMrtNormals, skipSimplPhongHeuristics) {
        if (supportsMrtNormals === void 0) { supportsMrtNormals = true; }
        if (skipSimplPhongHeuristics === void 0) { skipSimplPhongHeuristics = true; }
        //https://github.com/petrbroz/forge-basic-app/blob/custom-shader-material/public/HeatmapExtension.js
        var customMaterial = new THREE.MeshPhongMaterial(phongDefinition);
        customMaterial.side = THREE.DoubleSide;
        customMaterial.supportsMrtNormals = supportsMrtNormals;
        this.viewer.impl.matman().addOverrideMaterial(materialName, customMaterial);
        return (customMaterial);
    };
    ForgeViewer.prototype.assignMaterialToObjects = function (material, ids, model) {
        ids = ids || this.viewer.getSelection();
        model = model || this.viewer.model;
        model.unconsolidate(); // If the model is consolidated, material changes won't have any effect
        material = typeof material === 'string' ? this.viewer.impl.matman().getModelMaterials(model, true).mats[material] : material;
        var tree = model.getInstanceTree();
        var frags = model.getFragmentList();
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var dbid = ids_1[_i];
            tree.enumNodeFragments(dbid, function (fragid) {
                frags.setMaterial(fragid, material);
            });
        }
    };
    ForgeViewer.prototype.aggregateAssignMaterialToObjects = function (material, selection) {
        var _this = this;
        selection.forEach(function (elt) {
            _this.assignMaterialToObjects(material, elt.ids, elt.model);
        });
    };
    // #endregion
    // #region Utilities
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
    ForgeViewer.prototype.enumerateNodes = function (callback, recursive, parentId) {
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
     * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
     *   const ids = await utils.listNodes();
     *   console.log('Object IDs', ids);
     * });
     */
    ForgeViewer.prototype.listNodes = function (recursive, parentId) {
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
    ForgeViewer.prototype.enumerateLeafNodes = function (callback, recursive, parentId) {
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
     * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
     *   const ids = await utils.listLeafNodes();
     *   console.log('Leaf object IDs', ids);
     * });
     */
    ForgeViewer.prototype.listLeafNodes = function (recursive, parentId) {
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
    ForgeViewer.prototype.enumerateFragments = function (callback, recursive, parentId) {
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
     * viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, async () => {
     *   const ids = await utils.listFragments();
     *   console.log('Fragment IDs', ids);
     * });
     */
    ForgeViewer.prototype.listFragments = function (recursive, parentId) {
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
    ForgeViewer.prototype.getFragmentBounds = function (model, fragId, bounds) {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
     *     const transform = utils.getFragmentOrigTransform(fragId);
     *     console.log('Original fragment transform', transform);
     * });
     */
    ForgeViewer.prototype.getFragmentOrigTransform = function (model, fragId, transform) {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
     *   utils.getFragmentAuxTransform(fragId, scale, rotation, position);
     *   console.log('Scale', scale);
     *   console.log('Rotation', rotation);
     *   console.log('Position', position);
     * });
     */
    ForgeViewer.prototype.getFragmentAuxTransform = function (model, fragId, scale, rotation, position) {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
     *   utils.setFragmentAuxTransform(fragId, scale, null, position);
     * });
     */
    ForgeViewer.prototype.setFragmentAuxTransform = function (model, fragId, scale, rotation, position) {
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
     * viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
     *   try {
     *     const transform = utils.getFragmentTransform(1);
     *     console.log('Final fragment transform', transform);
     *   } catch(err) {
     *     console.error('Could not retrieve fragment transform', err);
     *   }
     * });
     */
    ForgeViewer.prototype.getFragmentTransform = function (model, fragId, transform) {
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
    ForgeViewer.prototype.refresh = function () {
        this.viewer.impl.invalidate(true, true, true);
    };
    // #endregion
    // #region UI
    ForgeViewer.prototype.getToolbar = function (id) {
        if (id === void 0) { id = 'default'; }
        return (id === 'default' || id === 'guiviewer3d-toolbar' ? this.viewer.getToolbar(true) : this.ui_references[id]);
    };
    ForgeViewer.prototype.createToolbar = function (id, def) {
        if (this.ui_references[id])
            return this.ui_references[id];
        var tb = new Autodesk.Viewing.UI.ToolBar(id);
        if (def.isVertical)
            tb.container.classList.add('adsk-toolbar-vertical');
        var offsetV = '10px';
        var offsetH = '15px';
        if (def.top || def.docking === ToolBarDockingSite.Top) {
            tb.container.style.top = def.top || offsetV;
            tb.container.style.bottom = 'unset';
            tb.container.classList.add('dock-top');
        }
        if (def.bottom || def.docking === ToolBarDockingSite.Bottom) {
            tb.container.style.bottom = def.bottom || offsetV;
            tb.container.style.top = 'unset';
        }
        if (def.left || def.docking === ToolBarDockingSite.Left) {
            tb.container.style.left = def.left || offsetH;
            tb.container.style.right = 'unset';
            tb.container.classList.add('dock-left');
        }
        if (def.right || def.docking === ToolBarDockingSite.Right) {
            tb.container.style.right = def.right || offsetH;
            tb.container.style.left = 'unset';
        }
        //tb.setGlobalManager(this.viewer.getGlobalManager);
        //tb.setVisible(true);
        this.viewer.container.appendChild(tb.container);
        this.ui_references[id] = tb;
        return (tb);
    };
    ForgeViewer.prototype.getGroupCtrl = function (tb, id) {
        return tb.getControl(id);
    };
    ForgeViewer.prototype.createControlGroup = function (viewerToolbar, groupName) {
        if (viewerToolbar.getControl(groupName))
            return viewerToolbar.getControl(groupName);
        var groupCtrl = new Autodesk.Viewing.UI.ControlGroup(groupName);
        //groupCtrl.setVisible(true);
        //groupCtrl.container.classList.add('toolbar-vertical-group');
        viewerToolbar.addControl(groupCtrl);
        this.ui_references[groupName] = groupCtrl;
        return (groupCtrl);
    };
    ForgeViewer.prototype.createRadioButtonGroup = function (viewerToolbar, groupName) {
        if (viewerToolbar.getControl(groupName))
            return viewerToolbar.getControl(groupName);
        var groupCtrl = new Autodesk.Viewing.UI.RadioButtonGroup(groupName);
        groupCtrl.setVisible(true);
        viewerToolbar.addControl(groupCtrl);
        this.ui_references[groupName] = groupCtrl;
        return (groupCtrl);
    };
    ForgeViewer.string2ButtonState = function (state) {
        if (typeof state === 'string') {
            switch (state) {
                case 'ACTIVE':
                case 'Autodesk.Viewing.UI.Button.State.ACTIVE':
                    state = Autodesk.Viewing.UI.Button.State.ACTIVE;
                    break;
                default:
                case 'INACTIVE':
                case 'Autodesk.Viewing.UI.Button.State.INACTIVE':
                    state = Autodesk.Viewing.UI.Button.State.INACTIVE;
                    break;
                case 'DISABLED':
                case 'Autodesk.Viewing.UI.Button.State.DISABLED':
                    state = Autodesk.Viewing.UI.Button.State.DISABLED;
                    break;
            }
        }
        return state;
    };
    ForgeViewer.string2CodeOrFunction = function (ref, uiHandlers) {
        if (typeof ref === 'string') {
            var fn = ((uiHandlers && uiHandlers[ref])
                || (window && window[ref])
                || (self && self[ref])
            //|| (global && (global as any)[ref as any])
            );
            if (fn)
                ref = fn;
            else
                ref = null;
        }
        return ref;
    };
    ForgeViewer.prototype.createButton = function (id, def, uiHandlers) {
        var _this = this;
        var self = this;
        var ctrl = def.children ?
            new Autodesk.Viewing.UI.ComboButton(id, { collapsible: (def.collapsible || def.children || false) })
            : def.bistate !== undefined ?
                new BistateButton(id, { bistate: def.bistate })
                : new Autodesk.Viewing.UI.Button(id, { collapsible: (def.collapsible || def.children || false) });
        ctrl.setToolTip(def.tooltip || '');
        //ctrl.setIcon(iconClass); // Unfortunately this API removes the previous class style applied :()
        if (typeof def.iconClass === 'string')
            def.iconClass = [def.iconClass];
        (def.iconClass || []).forEach(function (elt) { return ctrl.icon.classList.add(elt); });
        if (typeof def.buttonClass === 'string')
            def.buttonClass = [def.buttonClass];
        //(def.buttonClass || []).forEach((elt: string): void => ctrl.addClass(elt));
        (def.buttonClass || []).forEach(function (elt) { return ctrl.container.classList.add(elt); });
        ctrl.setVisible(def.visible !== undefined ? def.visible : true);
        ctrl.setState(def.state !== undefined ? ForgeViewer.string2ButtonState(def.state) : Autodesk.Viewing.UI.Button.State.INACTIVE);
        ctrl.onClick = ForgeViewer.string2CodeOrFunction(def.onClick, uiHandlers) || this._dumb_.bind(this);
        ctrl.onMouseOut = ForgeViewer.string2CodeOrFunction(def.onMouseOut, uiHandlers) || this._dumb_.bind(this);
        ctrl.onMouseOver = ForgeViewer.string2CodeOrFunction(def.onMouseOver, uiHandlers) || this._dumb_.bind(this);
        if (def.onVisibiltyChanged)
            ctrl.addEventListener(Autodesk.Viewing.UI.VISIBILITY_CHANGED, ForgeViewer.string2CodeOrFunction(def.onVisibiltyChanged, uiHandlers));
        if (def.onStateChanged)
            ctrl.addEventListener(Autodesk.Viewing.UI.STATE_CHANGED, ForgeViewer.string2CodeOrFunction(def.onStateChanged, uiHandlers));
        if (def.onCollapseChanged)
            ctrl.addEventListener(Autodesk.Viewing.UI.COLLAPSED_CHANGED, ForgeViewer.string2CodeOrFunction(def.onCollapseChanged, uiHandlers));
        if (def.children) {
            var combo_1 = ctrl;
            var ctrls = def.children.map(function (child) { return (_this.createButton(child.id, child, uiHandlers)); });
            ctrls.map(function (button) { return combo_1.addControl(button); });
            ctrls.map(function (button) {
                button._clientOnClick = button.onClick;
                button._parentCtrl = combo_1;
                button.onClick = self.onClickComboChild.bind(self);
            });
            if (!def.onClick && !def.iconClass)
                this.assignComboButton(combo_1, ctrls[0]);
            combo_1.saveAsDefault();
        }
        this.ui_references[id] = ctrl;
        return (ctrl);
    };
    ForgeViewer.prototype.createButtonInGroup = function (groupCtrl, id, def, uiHandlers) {
        var button = this.createButton(id, def, uiHandlers);
        groupCtrl.addControl(button, { index: (def.index || groupCtrl.getNumberOfControls()) }); // bug in type definition (aka interface AddControlOptions)
        return (button);
    };
    ForgeViewer.prototype.assignComboButton = function (combo, button) {
        combo.setToolTip(button.getToolTip() || '');
        combo.setVisible(button.isVisible());
        combo.setState(button.getState());
        combo.onClick = button._clientOnClick || this._dumb_.bind(this);
        combo.icon.classList.forEach(function (element) { return combo.icon.classList.remove(element); });
        button.icon.classList.forEach(function (element) { return combo.icon.classList.add(element); });
        combo.container.classList.forEach(function (element) { return combo.container.classList.remove(element); });
        button.container.classList.forEach(function (element) { return combo.container.classList.add(element); });
        combo._activeButton = button;
    };
    ForgeViewer.prototype.onClickComboChild = function (evt) {
        var button = this.ui_references[evt.currentTarget.id];
        var radioCtrl = button.parent;
        var combo = button._parentCtrl;
        this.assignComboButton(combo, button);
        radioCtrl._activeButton = button;
        if (button._clientOnClick)
            button._clientOnClick.call(self, evt);
    };
    ForgeViewer.prototype.getUI = function () {
        var toolbars = new Set([this.viewer.getToolbar(true)]);
        Object.values(this.ui_references)
            .filter(function (elt) { return elt instanceof Autodesk.Viewing.UI.ToolBar; })
            .forEach(function (tb) { return toolbars.add(tb); });
        var ids = [];
        toolbars.forEach(function (tb) {
            var groupIterator = function (parent, path) {
                var nbc = parent.getNumberOfControls();
                for (var c = 0; c < nbc; c++) {
                    var ctrl = parent.getControl(parent.getControlId(c));
                    ids.push([path, ctrl.getId()].join('/'));
                    if (ctrl instanceof Autodesk.Viewing.UI.ComboButton) {
                        var button = ctrl;
                        // shall we return options?
                        var subMenu = button.subMenu;
                        ids.push([path, ctrl.getId(), subMenu.getId()].join('/'));
                        groupIterator(subMenu, [path, ctrl.getId(), subMenu.getId()].join('/'));
                    }
                    else if (ctrl instanceof Autodesk.Viewing.UI.ControlGroup) {
                        var group = ctrl;
                        groupIterator(group, [path, group.getId()].join('/'));
                    }
                    else {
                        var button = ctrl;
                        // all done!
                    }
                }
            };
            ids.push('//' + tb.getId());
            groupIterator(tb, '//' + tb.getId());
        });
        return (ids);
    };
    ForgeViewer.prototype.getControls = function (searchpath) {
        var self = this;
        if (typeof searchpath === 'string')
            searchpath = [searchpath];
        //let all: Set<Autodesk.Viewing.UI.Control> = new Set<Autodesk.Viewing.UI.Control>();
        var uipath = this.getUI();
        var ctrls = searchpath.map(function (criteria) {
            criteria = criteria.replace(/\*/g, '.*');
            var regex = new RegExp(criteria);
            var results = uipath.filter(function (idpath) { return regex.test(idpath); });
            //all = new Set<Autodesk.Viewing.UI.Control>([ ...all, ...results ])
            var selection = results.map(function (idpath) { return self.getControl(idpath); });
            return (selection);
        });
        var all = new Set(ctrls.flat());
        return (Array.from(all));
    };
    ForgeViewer.prototype.getControl = function (idpath) {
        var _this = this;
        var ids = idpath.split('/').slice(2); // remove '//'
        var ctrl = null;
        ids.forEach(function (id) {
            if (!ctrl) {
                ctrl = _this.getToolbar(id);
            }
            else if (ctrl instanceof Autodesk.Viewing.UI.ControlGroup) {
                var group = ctrl;
                ctrl = group.getControl(id);
            }
            else if (ctrl instanceof Autodesk.Viewing.UI.ComboButton) {
                var button = ctrl;
                var subMenu = button.subMenu;
                if (subMenu.getId() !== id) // path skip the intermediate subMenu group, id represent the option (button)
                    ctrl = subMenu.getControl(id);
            }
            else {
                var button = ctrl;
                if (button.getId() !== id)
                    ctrl = null;
                // all done!
            }
        });
        return (ctrl);
    };
    ForgeViewer.prototype._dumb_ = function (evt) { };
    ForgeViewer.prototype.buildUI = function (ui_definition, uiHandlers) {
        ui_definition = ui_definition || this.ui_definition;
        uiHandlers = uiHandlers || this.ui_handlers;
        if (!ui_definition)
            return (null);
        var that = this;
        var toolbars = new Set([this.viewer.getToolbar(true)]);
        Object.keys(ui_definition).map(function (tbId) {
            var tbDef = that.ui_definition[tbId];
            var tb = that.getToolbar(tbId) || that.createToolbar(tbId, tbDef);
            Object.keys(tbDef).map(function (grpId) {
                var grpDef = tbDef[grpId];
                if (['top', 'left', 'bottom', 'right', 'docking', 'isVertical'].indexOf(grpId) > -1)
                    return;
                var groupCtrl = that.getGroupCtrl(tb, grpId) || that.createControlGroup(tb, grpId);
                Object.values(grpDef).map(function (ctrlDef) {
                    //const ctrlDef: any = grpDef[ctrlId];
                    var ctrl = groupCtrl.getControl(ctrlDef.id) || that.createButtonInGroup(groupCtrl, ctrlDef.id, ctrlDef, uiHandlers);
                });
            });
            toolbars.add(tb);
        });
        return (Array.from(toolbars));
    };
    ForgeViewer.prototype.moveCtrl = function (ctrl, parent, options) {
        ctrl = typeof ctrl === 'string' ? this.getControl(ctrl) : ctrl;
        parent = typeof parent === 'string' ? this.getControl(parent) : parent;
        if (parent instanceof Autodesk.Viewing.UI.ControlGroup === false)
            return;
        var currentParent = ctrl.parent;
        currentParent.removeControl(ctrl);
        parent.addControl(ctrl, options);
    };
    ForgeViewer.prototype.moveToolBar = function (tb, docking, offset) {
        if (tb === void 0) { tb = 'default'; }
        if (docking === void 0) { docking = ToolBarDockingSite.Bottom; }
        if (offset === void 0) { offset = undefined; }
        tb = typeof tb === 'string' ? this.getToolbar(tb) : tb;
        // 'adsk-toolbar-vertical'
        var isVertical = docking === ToolBarDockingSite.Left || docking === ToolBarDockingSite.Right;
        if (isVertical)
            tb.container.classList.add('adsk-toolbar-vertical');
        else
            tb.container.classList.remove('adsk-toolbar-vertical');
        var offsetV = '10px';
        var offsetH = '15px';
        tb.container.classList.remove('dock-top');
        tb.container.classList.remove('dock-left');
        if (docking === ToolBarDockingSite.Top) {
            tb.container.style.top = offset || offsetV;
            tb.container.style.bottom = 'unset';
            tb.container.classList.add('dock-top');
        }
        if (docking === ToolBarDockingSite.Bottom) {
            tb.container.style.bottom = offset || offsetV;
            tb.container.style.top = 'unset';
        }
        if (docking === ToolBarDockingSite.Left) {
            tb.container.style.left = offset || offsetH;
            tb.container.style.right = 'unset';
            tb.container.classList.add('dock-left');
        }
        if (docking === ToolBarDockingSite.Right) {
            tb.container.style.right = offset || offsetH;
            tb.container.style.left = 'unset';
        }
    };
    // #endregion
    // #region Data Visualization
    ForgeViewer.prototype.getVizExtension = function () {
        return this.viewer.getExtension('Autodesk.DataVisualization');
    };
    ForgeViewer.prototype.createSpriteStyle = function (color, spriteIconUrl, highlightedColor, highlightedUrl, animatedUrls) {
        if (color === void 0) { color = 0xffffff; }
        if (spriteIconUrl === void 0) { spriteIconUrl = '/images/circle.svg'; }
        return (new Autodesk.DataVisualization.Core.ViewableStyle(Autodesk.DataVisualization.Core.ViewableType.SPRITE, new THREE.Color(color), spriteIconUrl, new THREE.Color(highlightedColor), highlightedUrl, animatedUrls));
    };
    ForgeViewer.prototype.createSprites = function (positions, defaultStyle, spriteSize) {
        if (spriteSize === void 0) { spriteSize = 24; }
        var viewableData = new Autodesk.DataVisualization.Core.ViewableData();
        viewableData.spriteSize = spriteSize; // Sprites as points of size 24 x 24 pixels
        positions.forEach(function (data, index) {
            var viewable = new Autodesk.DataVisualization.Core.SpriteViewable(data.position, data.style || defaultStyle, data.dbId);
            viewableData.addViewable(viewable);
        });
        return (viewableData);
    };
    ForgeViewer.prototype.addSpritesToScene = function (sprites) {
        return __awaiter(this, void 0, void 0, function () {
            var ext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sprites.finish()];
                    case 1:
                        _a.sent();
                        ext = this.getVizExtension();
                        ext.addViewables(sprites);
                        return [2 /*return*/];
                }
            });
        });
    };
    ForgeViewer.prototype.setSpritesVisbility = function (showSprites) {
        if (showSprites === void 0) { showSprites = true; }
        return __awaiter(this, void 0, void 0, function () {
            var ext;
            return __generator(this, function (_a) {
                ext = this.getVizExtension();
                ext.showHideViewables(showSprites, true);
                return [2 /*return*/];
            });
        });
    };
    // #endregion
    // #endregion
    // #region Viewer Endpoints Options
    ForgeViewer.prototype.options = function (config, region) {
        if (region === void 0) { region = 'US'; }
        var getAccessToken = typeof this.getAccessToken === 'string' ?
            this.getAccessTokenFct
            : this.getAccessToken;
        var options = {
            svf: {
                env: 'AutodeskProduction',
                api: 'derivativeV2' + (region === 'EMEA' ? '_EU' : ''),
                useCookie: false,
                useCredentials: true,
                //acmSessionId: urn,
                getAccessToken: getAccessToken,
                tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
            },
            otg: {
                env: 'FluentProduction' + (region === 'EMEA' ? 'EU' : ''),
                api: 'fluent',
                useCookie: false,
                useCredentials: true,
                //acmSessionId: urn,
                getAccessToken: getAccessToken,
                tokenURL: (getAccessToken === this.getAccessTokenFct ? this.getAccessToken : null),
            },
            svf2: {
                env: (region === 'EMEA' ? 'MD20ProdEU' : 'MD20ProdUS'),
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
    ForgeViewer.NAVTOOLBAR = 'navTools';
    ForgeViewer.MEASURETOOLBAR = 'measureTools';
    ForgeViewer.MODELTOOLBAR = 'modelTools';
    ForgeViewer.SETTINGSTOOLBAR = 'settingsTools';
    return ForgeViewer;
}());
// #endregion
//# sourceMappingURL=ForgeViewer.js.map