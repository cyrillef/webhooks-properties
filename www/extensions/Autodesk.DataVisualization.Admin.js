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
//import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
//import * as MeshLine from '../../../www/js/THREE.MeshLine.js'
//AutodeskNamespace('Autodesk.DataVisualization.Admin');
var Autodesk;
(function (Autodesk) {
    var DataVisualization;
    (function (DataVisualization) {
        var Admin;
        (function (Admin) {
            var Vector3FromBufferAttribute = function (attribute, index, offset) {
                if (offset !== undefined)
                    console.warn('THREE.Vector3: offset has been removed from .fromBufferAttribute().');
                return (new THREE.Vector3(
                // attribute.getX(index),
                // attribute.getY(index),
                // attribute.getZ(index)
                attribute.array[index * attribute.itemSize], attribute.array[index * attribute.itemSize + 1], attribute.array[index * attribute.itemSize + 2]));
            };
            var Float32BufferAttribute = /** @class */ (function (_super) {
                __extends(Float32BufferAttribute, _super);
                function Float32BufferAttribute(array, itemSize, normalized) {
                    return _super.call(this, new Float32Array(array), itemSize /*, normalized*/) || this;
                }
                return Float32BufferAttribute;
            }(THREE.BufferAttribute));
            var LineSegments = /** @class */ (function (_super) {
                __extends(LineSegments, _super);
                function LineSegments(geometry, material) {
                    var _this = _super.call(this, geometry, material) || this;
                    _this.type = 'LineSegments';
                    return _this;
                }
                LineSegments.prototype.computeLineDistances = function () {
                    var geometry = this.geometry;
                    if (geometry.isBufferGeometry) {
                        // we assume non-indexed geometry
                        var _geometry = geometry;
                        if (_geometry.index === null) {
                            var positionAttribute = _geometry.attributes.position;
                            var lineDistances = [];
                            for (var i = 0, l = positionAttribute.count; i < l; i += 2) {
                                LineSegments._start = Vector3FromBufferAttribute(positionAttribute, i);
                                LineSegments._end = Vector3FromBufferAttribute(positionAttribute, i + 1);
                                lineDistances[i] = (i === 0) ? 0 : lineDistances[i - 1];
                                lineDistances[i + 1] = lineDistances[i] + LineSegments._start.distanceTo(LineSegments._end);
                            }
                            //(_geometry as any).setAttribute('lineDistance', new Float32BufferAttribute(lineDistances, 1));
                            _geometry.attributes.lineDistance = new Float32BufferAttribute(lineDistances, 1);
                        }
                        else {
                            console.warn('THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.');
                        }
                    }
                    else if (geometry.isGeometry) {
                        console.error('THREE.LineSegments.computeLineDistances() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.');
                    }
                    return (this);
                };
                LineSegments._start = new THREE.Vector3();
                LineSegments._end = new THREE.Vector3();
                return LineSegments;
            }(THREE.Line));
            if (!THREE.BufferGeometry.prototype.setAttribute)
                THREE.BufferGeometry.prototype.setAttribute = function (name, attribute) {
                    this.attributes[name] = attribute;
                    return (this);
                };
            // THREE.Box3.prototype.setFromObject = function (object: THREE.Object3D): THREE.Box3 {
            // 	this.makeEmpty();
            // 	return (this.expandByObject(object));
            // }
            var BoxHelper = /** @class */ (function (_super) {
                __extends(BoxHelper, _super);
                function BoxHelper(object, color) {
                    if (color === void 0) { color = 0x00ffff; }
                    var _this = this;
                    var indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]);
                    var positions = new Float32Array(8 * 3);
                    var geometry = new THREE.BufferGeometry();
                    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    var material = new THREE.LineBasicMaterial({ color: color /*, toneMapped: false*/ });
                    //viewer.impl.matman().addMaterial(SetupTool.guid(), material, true);
                    _this = _super.call(this, geometry, material) || this;
                    _this._material = material;
                    _this._object = object;
                    _this.type = 'BoxHelper';
                    _this.matrixAutoUpdate = false;
                    //this.mode = _gl.LINES;
                    //const _gl: any = NOP_VIEWER.impl.canvas.getContext('webgl2');
                    _this.mode = 1; // _gl.LINES=1 ; _gl.LINE_STRIP=3
                    _this.update();
                    return _this;
                }
                Object.defineProperty(BoxHelper.prototype, "_object", {
                    get: function () { return (this.object); },
                    set: function (object) { this.object = object; },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BoxHelper.prototype, "lineMaterial", {
                    get: function () { return (this._material); },
                    enumerable: false,
                    configurable: true
                });
                BoxHelper.prototype.update = function (object) {
                    if (object !== undefined)
                        console.warn('THREE.BoxHelper: .update() has no longer arguments.');
                    if (this._object !== undefined)
                        BoxHelper._box.setFromObject(this._object);
                    if (BoxHelper._box.isEmpty())
                        return;
                    var min = BoxHelper._box.min;
                    var max = BoxHelper._box.max;
                    /*
                        5____4
                    1/___0/|
                    | 6__|_7
                    2/___3/
                    0: max.x, max.y, max.z
                    1: min.x, max.y, max.z
                    2: min.x, min.y, max.z
                    3: max.x, min.y, max.z
                    4: max.x, max.y, min.z
                    5: min.x, max.y, min.z
                    6: min.x, min.y, min.z
                    7: max.x, min.y, min.z
                    */
                    var position = this.geometry.getAttribute('position');
                    var array = position.array;
                    array[0] = max.x;
                    array[1] = max.y;
                    array[2] = max.z;
                    array[3] = min.x;
                    array[4] = max.y;
                    array[5] = max.z;
                    array[6] = min.x;
                    array[7] = min.y;
                    array[8] = max.z;
                    array[9] = max.x;
                    array[10] = min.y;
                    array[11] = max.z;
                    array[12] = max.x;
                    array[13] = max.y;
                    array[14] = min.z;
                    array[15] = min.x;
                    array[16] = max.y;
                    array[17] = min.z;
                    array[18] = min.x;
                    array[19] = min.y;
                    array[20] = min.z;
                    array[21] = max.x;
                    array[22] = min.y;
                    array[23] = min.z;
                    position.needsUpdate = true;
                    this.geometry.computeBoundingSphere();
                    this.geometry.computeBoundingBox();
                };
                BoxHelper.prototype.setFromObject = function (object) {
                    this._object = object;
                    this.update();
                    return (this);
                };
                BoxHelper.prototype.copy = function (source) {
                    THREE.LineSegments.prototype.copy.call(this, source);
                    this._object = source.object;
                    return (this);
                };
                BoxHelper._box = new THREE.Box3();
                return BoxHelper;
            }(LineSegments));
            // #region SetupTool
            var SetupTool = /** @class */ (function () {
                function SetupTool(viewer, options) {
                    this._viewer = null;
                    this._options = null;
                    this._overlayScene = "DataVisualizationSetupToolOverlay";
                    this._hitTest = null;
                    this._lineMaterial = null;
                    this._useOverlay = true;
                    this._viewer = viewer;
                    this._options = options;
                }
                Object.defineProperty(SetupTool, "extensionId", {
                    // #region Protocol
                    get: function () {
                        return (SetupTool.ID);
                    },
                    enumerable: false,
                    configurable: true
                });
                /**
                 * This method should return an array containing the names of all tools implemented by this class.
                 * Often this would be a single name but it is possible to support multiple interactions with a single tool.
                 * When this tool is registered with the ToolController each name gets registered as an available tool.
                 *
                 * @returns {Array} Array of strings. Should not be empty.
                 */
                SetupTool.prototype.getNames = function () {
                    return ([SetupTool.extensionId]);
                };
                /**
                 * This is an optional convenience method to obtain the first name of this tool.
                 *
                 * @returns {string} The tools default name.
                 */
                SetupTool.prototype.getName = function () {
                    return (SetupTool.extensionId);
                };
                /**
                 * This method should return the priority of the tool inside the tool stack.
                 * A tool with higher priority will get events first.
                 *
                 * @returns {number} The tool's priority.
                 */
                // public getPriority(): number {
                // 	return (0);
                // }
                /**
                 * This method is called by {@link Autodesk.Viewing.ToolController#registerTool}.
                 * Use this for initialization.
                 */
                SetupTool.prototype.register = function () {
                };
                /**
                 * This method is called by {@link Autodesk.Viewing.ToolController#deregisterTool}.
                 * Use this to clean up your tool.
                 */
                SetupTool.prototype.deregister = function () {
                };
                /**
                 * The activate method is called by the ToolController when it adds this tool to the list of those
                 * to receive event handling calls. Once activated, a tool's "handle*" methods may be called
                 * if no other higher priority tool handles the given event. Each active tool's "update" method also gets
                 * called once during each redraw loop.
                 *
                 * @param {string} name - The name under which the tool has been activated.
                 * @param {Autodesk.Viewing.Viewer3D} viewerApi - Viewer instance.
                 */
                SetupTool.prototype.activate = function (name, viewer) {
                    this._viewer = viewer || this._viewer;
                    this.createOverlay();
                    this._lineMaterial = this.createLineMaterial();
                    //this.viewer.select([]);
                    //const bbox: THREE.Box3 = this.viewer.model.getBoundingBox();
                };
                /**
                 * The deactivate method is called by the ToolController when it removes this tool from the list of those
                 * to receive event handling calls. Once deactivated, a tool's "handle*" methods and "update" method
                 * will no longer be called.
                 *
                 * @param {string} name - The name under which the tool has been deactivated.
                 */
                SetupTool.prototype.deactivate = function (name) {
                    this._lineMaterial = null;
                    this.deleteOverlay();
                };
                // public getCursor(): string {
                // 	return ('none');
                // }
                // #endregion
                // #region Events Handlers
                /**
                 * The update method is called by the ToolController once per frame and provides each tool
                 * with the oportunity to make modifications to the scene or the view.
                 *
                 * @param {number} highResTimestamp - The process timestamp passed to requestAnimationFrame by the web browser.
                 * @returns {boolean} A state value indicating whether the tool has modified the view or the scene
                 * and a full refresh is required.
                 */
                SetupTool.prototype.update = function (highResTimestamp) {
                    return (false);
                };
                /**
                 * This method is called when a single mouse button click occurs.
                 *
                 * @param {MouseEvent} event - The event object that triggered this call.
                 * @param {number} button - The button number that was clicked (0, 1, 2 for Left, Middle, Right respectively).
                 * Note that the button parameter value may be different that the button value indicated in the event
                 * object due to button re-mapping preferences that may be applied. This value should be respected
                 * over the value in the event object.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass
                 * the event to lower priority active tools.
                 */
                // public handleSingleClick(event: MouseEvent, button: number): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a double mouse button click occurs.
                 *
                 * @param {MouseEvent} event - The event object that triggered this call.
                 * @param {number} button - The button number that was clicked (0, 1, 2 for Left, Middle, Right respectively).
                 * Note that the button parameter value may be different that the button value indicated in the event
                 * object due to button re-mapping preferences that may be applied. This value should be respected
                 * over the value in the event object.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleDoubleClick(event: MouseEvent, button: number): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a single tap on a touch device occurs.
                 *
                 * @param {Event} event - The triggering event. For tap events the canvasX, canvasY properties contain
                 * the canvas relative device coordinates of the tap and the normalizedX, normalizedY properties contain
                 * the tap coordinates in the normalized [-1, 1] range. The event.pointers array will contain
                 * either one or two touch events depending on whether the tap used one or two fingers.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleSingleTap(event: Event): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a double tap on a touch device occurs.
                 *
                 * @param {Event} event - The triggering event. For tap events the canvasX, canvasY properties contain
                 * the canvas relative device coordinates of the tap and the normalizedX, normalizedY properties contain
                 * the tap coordinates in the normalized [-1, 1] range. The event.pointers array will contain
                 * either one or two touch events depending on whether the tap used one or two fingers.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleDoubleTap(event: Event): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a keyboard button is depressed.
                 *
                 * @param {KeyboardEvent} event - The event object that triggered this call.
                 * @param {number} keyCode - The numerical key code identifying the key that was depressed.
                 * Note that the keyCode parameter value may be different that the value indicated in the event object
                 * due to key re-mapping preferences that may be applied. This value should be respected
                 * over the value in the event object.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleKeyDown(event: KeyboardEvent, keyCode: number): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a keyboard button is released.
                 *
                 * @param {KeyboardEvent} event - The event object that triggered this call.
                 * @param {number} keyCode - The numerical key code identifying the key that was released.
                 * Note that the keyCode parameter value may be different that the value indicated in the event object
                 * due to key re-mapping preferences that may be applied. This value should be respected
                 * over the value in the event object.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleKeyUp(event: KeyboardEvent, keyCode: number): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a mouse wheel event occurs.
                 *
                 * @param {number} delta - A numerical value indicating the amount of wheel motion applied.
                 * Note that this value may be modified from the orignal event values so as to provide consistent results
                 * across browser families.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleWheelInput(delta: number): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a mouse button is depressed.
                 *
                 * @param {MouseEvent} event - The event object that triggered this call.
                 * @param {number} button - The button number that was depressed (0, 1, 2 for Left, Middle, Right respectively).
                 * Note that the button parameter value may be different that the button value indicated in the event object
                 * due to button re-mapping preferences that may be applied. This value should be respected
                 * over the value in the event object.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleButtonDown(event: MouseEvent, button: number): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a mouse button is released.
                 *
                 * @param {MouseEvent} event - The event object that triggered this call.
                 * @param {number} button - The button number that was released (0, 1, 2 for Left, Middle, Right respectively).
                 * Note that the button parameter value may be different that the button value indicated in the event object
                 * due to button re-mapping preferences that may be applied. This value should be respected
                 * over the value in the event object.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleButtonUp(event: Autodesk.Viewing.ForgeMouseEvent, button: number): boolean {
                //console.log(event);
                // this._hitTest = this.getHitObject(event);
                // if (!this._hitTest)
                // 	return (false);
                // const bbox: THREE.Box3 = this.getBoundingBox(this._hitTest.dbId);
                // const fragList: Autodesk.Viewing.Private.FragmentList = this._viewer.model.getFragmentList();
                // const fragProxy: any = this._viewer.impl.getFragmentProxy(this._viewer.model, this._hitTest.fragId);
                // const renderProxy: any = this._viewer.impl.getRenderProxy(this._viewer.model, this._hitTest.fragId);
                // fragProxy.getAnimTransform();
                // const geometry: any = renderProxy.geometry;
                // const attributes: any = geometry.attributes;
                // attributes.position.array = geometry.vb
                // const gg = fragList.getVizmesh(this._hitTest.fragId);
                // const bboxh: BoxHelper = this.createBoundingBox(gg);
                // this._viewer.impl.matman().addMaterial(SetupTool.guid(), bboxh.material, true);
                // this._viewer.impl.invalidate(true, true, true);
                // 	return (false);
                // }
                /**
                 * This method is called when a mouse motion event occurs.
                 *
                 * @param {MouseEvent} event - The event object that triggered this call.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleMouseMove(event: MouseEvent): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when a touch gesture event occurs.
                 *
                 * @param {Event} event - The event object that triggered this call. The event.type attribute will indicate
                 * the gesture event type. This will be one of: dragstart, dragmove, dragend, panstart, panmove, panend,
                 * pinchstart, pinchmove, pinchend, rotatestart, rotatemove, rotateend, drag3start, drag3move, drag3end.
                 * The event.canvas[XY] attributes will contain the coresponding touch position.
                 * The event.scale and event.rotation attributes contain pinch scaling and two finger rotation quantities
                 * respectively. The deltaX and deltaY attributes will contain drag offsets.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleGesture(event: Event): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when the canvas area loses focus.
                 *
                 * @param {FocusEvent} event - The event object that triggered this call.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleBlur(event: Event): boolean {
                // 	return (false);
                // }
                /**
                 * This method is called when the canvas area loses focus.
                 *
                 * @param {FocusEvent} event - The event object that triggered this call.
                 * @returns {boolean} True if this tool wishes to consume the event and false to continue to pass the event
                 * to lower priority active tools.
                 */
                // public handleResize(): void {
                // }
                // #endregion
                // #region Utilities
                SetupTool.prototype.createOverlay = function () {
                    return (this._viewer.impl.createOverlayScene(this._overlayScene));
                };
                SetupTool.prototype.deleteOverlay = function () {
                    return (this._viewer.impl.removeOverlayScene(this._overlayScene));
                };
                SetupTool.prototype.createLineMaterial = function (color, linewidth) {
                    if (color === void 0) { color = 0x00ffff; }
                    if (linewidth === void 0) { linewidth = 15; }
                    var material = new THREE.LineBasicMaterial(//{ color: color/*, toneMapped: false*/ });
                    {
                        color: color,
                        linewidth: linewidth,
                        //transparent: true,
                        side: THREE.DoubleSide,
                        //opacity: 0.0, // will change with fade-in
                        depthTest: true,
                        depthWrite: true,
                        blending: THREE.NoBlending // NOTE: Overlay target is blended anyway. So, using blend here would blend with black.
                    });
                    this._viewer.impl.matman().addMaterial(SetupTool.guid(), material, true);
                    return (material);
                };
                SetupTool.prototype.addToScene = function (obj) {
                    var _this = this;
                    if (!Array.isArray(obj))
                        obj = [obj];
                    obj.map(function (elt) {
                        if (!_this._useOverlay) {
                            _this._viewer.impl.scene.add(elt);
                            _this._viewer.impl.invalidate(true, true, false);
                        }
                        else {
                            _this._viewer.impl.addOverlay(_this._overlayScene, elt);
                            _this._viewer.impl.invalidate(false, false, true);
                        }
                        //this._toRemove.push(obj);
                    });
                };
                SetupTool.prototype.removeFromScene = function (obj) {
                    var _this = this;
                    if (!Array.isArray(obj))
                        obj = [obj];
                    obj.map(function (elt) {
                        if (!_this._useOverlay) {
                            _this._viewer.impl.scene.remove(elt);
                            _this._viewer.impl.invalidate(true, true, false);
                        }
                        else {
                            _this._viewer.impl.removeOverlay(_this._overlayScene, elt);
                            _this._viewer.impl.invalidate(false, false, true);
                        }
                    });
                };
                SetupTool.prototype.handleSingleClick = function (event, button) {
                    //console.log(event);
                    this._hitTest = this.getHitObject(event);
                    if (!this._hitTest)
                        return (false);
                    // const bbox: THREE.Box3 = this.getBoundingBox(this._hitTest.dbId);
                    var fragList = this._viewer.model.getFragmentList();
                    // const fragProxy: any = this._viewer.impl.getFragmentProxy(this._viewer.model, this._hitTest.fragId);
                    var renderProxy = this._viewer.impl.getRenderProxy(this._viewer.model, this._hitTest.fragId);
                    // fragProxy.getAnimTransform();
                    var geometry = renderProxy.geometry;
                    var attributes = geometry.attributes;
                    attributes.position.array = geometry.vb;
                    var gg = fragList.getVizmesh(this._hitTest.fragId);
                    //const bboxh: BoxHelper = this.createBoundingBox(gg);
                    // this._viewer.impl.matman().addMaterial(SetupTool.guid(), bboxh.material, true);
                    // this._viewer.impl.invalidate(true, true, true);
                    // const geometryLines = new THREE.Geometry()
                    // geometryLines.vertices.push(new THREE.Vector3(0, 0, 0));
                    // geometryLines.vertices.push(new THREE.Vector3(10, 10, 10));
                    // geometryLines.vertices.push(new THREE.Vector3(10, 10, 10));
                    // geometryLines.vertices.push(new THREE.Vector3(20, 10, 20));
                    // const lines = new THREE.Line(geometryLines, this._lineMaterial, 1);
                    // this.addToScene(lines);
                    var pts = [
                        0, 0, 0,
                        10, 10, 10,
                        10, 15, 10,
                        20, 10, 20
                    ];
                    // @ts-ignore
                    var line = new MeshLine();
                    // line.setPoints(pts);
                    var geometryCore = new THREE.Geometry();
                    geometryCore.vertices = [
                        new THREE.Vector3().fromArray(pts, 0),
                        new THREE.Vector3().fromArray(pts, 3),
                        new THREE.Vector3().fromArray(pts, 6),
                        new THREE.Vector3().fromArray(pts, 9)
                    ];
                    line.setGeometry(geometryCore);
                    // const geometryBuffer = new THREE.BufferGeometry()
                    // geometryBuffer.addAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
                    // line.setGeometry (geometryBuffer);
                    var dims = this._viewer.getDimensions();
                    var resolution = new THREE.Vector2(dims.width, dims.height);
                    //(vp, 50);
                    // @ts-ignore
                    var material = new MeshLineMaterial({
                        color: new THREE.Color(0x00ffff),
                        lineWidth: 0.01,
                        // transparent: true,
                        resolution: resolution,
                        // side: THREE.DoubleSide,
                        // opacity: 1.0, // will change with fade-in
                        depthTest: false,
                        depthWrite: false,
                        sizeAttenuation: 1,
                        attributes: {
                            previous: line.previous,
                            next: line.next,
                            side: line.side,
                            width: line.width,
                            counters: line.counters
                        }
                        // attributes: line.attributes
                    });
                    this._viewer.impl.matman().addMaterial(SetupTool.guid(), material, true);
                    var lineMesh = new THREE.Mesh(line.geometry, material);
                    this.addToScene(lineMesh);
                    // let vertsNonIndexed = new Float32Array(3 * 4);
                    // vertsNonIndexed.set([
                    // 	0, 0, 0,
                    // 	10, 10, 10,
                    // 	20, 10, 20,
                    // 	1, 10, 1
                    // ]);
                    // // let geometryl = new THREE.BufferGeometry();
                    // // geometryl.setAttribute('position', new THREE.BufferAttribute(vertsNonIndexed, 3));
                    // // geometryl.computeVertexNormals();
                    // const lineIndices = new Uint32Array([
                    // 	0, 1,
                    // 	0, 2,
                    // 	0, 3
                    // ]);
                    // let lineGeom = new THREE.BufferGeometry();
                    // lineGeom.setIndex(new THREE.BufferAttribute(lineIndices, 1));
                    // lineGeom.setAttribute('position', new THREE.BufferAttribute(vertsNonIndexed, 3));
                    // (lineGeom as any).isLines = true;
                    // //let lineGeom2 = new THREE.LineGe
                    // const lineMesh = new THREE.Mesh(lineGeom, this._lineMaterial);
                    // this.addToScene(lineMesh);
                    return (false);
                };
                SetupTool.prototype.handleSingleClick1 = function (event, button) {
                    //console.log(event);
                    this._hitTest = this.getHitObject(event);
                    if (!this._hitTest)
                        return (false);
                    // const bbox: THREE.Box3 = this.getBoundingBox(this._hitTest.dbId);
                    var fragList = this._viewer.model.getFragmentList();
                    // const fragProxy: any = this._viewer.impl.getFragmentProxy(this._viewer.model, this._hitTest.fragId);
                    var renderProxy = this._viewer.impl.getRenderProxy(this._viewer.model, this._hitTest.fragId);
                    // fragProxy.getAnimTransform();
                    var geometry = renderProxy.geometry;
                    var attributes = geometry.attributes;
                    attributes.position.array = geometry.vb;
                    var gg = fragList.getVizmesh(this._hitTest.fragId);
                    //const bboxh: BoxHelper = this.createBoundingBox(gg);
                    // this._viewer.impl.matman().addMaterial(SetupTool.guid(), bboxh.material, true);
                    // this._viewer.impl.invalidate(true, true, true);
                    // const geometryLines = new THREE.Geometry()
                    // geometryLines.vertices.push(new THREE.Vector3(0, 0, 0));
                    // geometryLines.vertices.push(new THREE.Vector3(10, 10, 10));
                    // geometryLines.vertices.push(new THREE.Vector3(10, 10, 10));
                    // geometryLines.vertices.push(new THREE.Vector3(20, 10, 20));
                    // const lines = new THREE.Line(geometryLines, this._lineMaterial, 1);
                    // this.addToScene(lines);
                    var vertsNonIndexed = new Float32Array(3 * 4);
                    vertsNonIndexed.set([
                        0, 0, 0,
                        10, 10, 10,
                        20, 10, 20,
                        1, 10, 1
                    ]);
                    // let geometryl = new THREE.BufferGeometry();
                    // geometryl.setAttribute('position', new THREE.BufferAttribute(vertsNonIndexed, 3));
                    // geometryl.computeVertexNormals();
                    var lineIndices = new Uint32Array([
                        0, 1,
                        0, 2,
                        0, 3
                    ]);
                    var lineGeom = new THREE.BufferGeometry();
                    lineGeom.setIndex(new THREE.BufferAttribute(lineIndices, 1));
                    lineGeom.setAttribute('position', new THREE.BufferAttribute(vertsNonIndexed, 3));
                    lineGeom.isLines = true;
                    var lineMesh = new THREE.Mesh(lineGeom, this._lineMaterial);
                    this.addToScene(lineMesh);
                    return (false);
                };
                SetupTool.prototype.raytrace = function (psource, vray, max_dist, meshes) {
                    var ray = new THREE.Raycaster(psource, vray, 0, max_dist);
                    var intersectResults = ray.intersectObjects(meshes, true);
                    return (intersectResults);
                };
                SetupTool.prototype.getHitPoint = function (event) {
                    var screenPoint = new THREE.Vector2(event.clientX, event.clientY);
                    screenPoint = this.normalizeCoordinates(screenPoint);
                    var viewer = this._viewer;
                    var hitPoint = viewer.utilities.getHitPoint(screenPoint.x, screenPoint.y);
                    return (hitPoint);
                };
                SetupTool.prototype.getHitObject = function (event) {
                    // let screenPoint: THREE.Vector2 = new THREE.Vector2(event.clientX, event.clientY);
                    // screenPoint = this.normalizeCoordinates(screenPoint);
                    // const viewer: Autodesk.Viewing.GuiViewer3D = this._viewer as Autodesk.Viewing.GuiViewer3D;
                    var screenPoint = new THREE.Vector2(event.canvasX, event.canvasY);
                    var hitTest = this._viewer.impl.hitTest(screenPoint.x, screenPoint.y, true);
                    return (hitTest);
                };
                SetupTool.prototype.normalizeCoordinates = function (screenPoint) {
                    var viewport = this._viewer.navigation.getScreenViewport();
                    return (new THREE.Vector2((screenPoint.x - viewport.left) / viewport.width, (screenPoint.y - viewport.top) / viewport.height));
                };
                // Bounding Box
                // https://forge.autodesk.com/blog/working-2d-and-3d-scenes-and-geometry-forge-viewer
                SetupTool.prototype.getBoundingBox = function (dbId) {
                    // this._viewer.model.getBoundingBox () // full model bounding box
                    // We need the Object bounding box, not the model
                    var bounds = new THREE.Box3();
                    var box = new THREE.Box3();
                    var instanceTree = this._viewer.model.getData().instanceTree;
                    var fragList = this._viewer.model.getFragmentList();
                    instanceTree.enumNodeFragments(dbId, function (fragId) {
                        fragList.getWorldBounds(fragId, box);
                        bounds.union(box);
                    }, true);
                    //console.log (bounds) ;
                    return (bounds);
                };
                SetupTool.prototype.findBoundingBoxCenters = function (dbId, bounds) {
                    bounds = bounds || this.getBoundingBox(dbId);
                    var center = bounds.center();
                    var size = bounds.size();
                    var up = this._viewer.navigation.getWorldUpVector();
                    var faceCenters = []; // This is sensors possible places
                    if (up.x === 0) {
                        var pt = center.clone();
                        pt.x += size.x / 2;
                        faceCenters.push(pt);
                        pt = center.clone();
                        pt.x -= size.x / 2;
                        faceCenters.push(pt);
                    }
                    if (up.y === 0) {
                        var pt = center.clone();
                        pt.y += size.y / 2;
                        faceCenters.push(pt);
                        pt = center.clone();
                        pt.y -= size.y / 2;
                        faceCenters.push(pt);
                    }
                    if (up.z === 0) {
                        var pt = center.clone();
                        pt.z += size.z / 2;
                        faceCenters.push(pt);
                        pt = center.clone();
                        pt.z -= size.z / 2;
                        faceCenters.push(pt);
                    }
                    return (faceCenters);
                };
                SetupTool.prototype.findPOIFromBoundingBox = function (dbId, dist, camera) {
                    if (dist === void 0) { dist = 5; }
                    var bounds = this.getBoundingBox(dbId);
                    var faceCenters = this.findBoundingBoxCenters(dbId, bounds);
                    // Now choose the closest to the camera viewpoint
                    camera = camera || this._viewer.navigation.getCamera();
                    var d0 = -1, i0 = -1;
                    for (var i = 0; i < faceCenters.length; i++) {
                        var d = camera.position.distanceTo(faceCenters[i]);
                        if (i0 === -1 || d < d0) {
                            i0 = i;
                            d0 = d;
                        }
                    }
                    var position = faceCenters[i0].clone();
                    var viewDir = bounds.center().clone().sub(position).normalize();
                    position.sub(viewDir.multiplyScalar(dist));
                    return (position);
                };
                // Utilities
                // protected xx(event: Autodesk.Viewing.ForgeMouseEvent, ignoreTransparent: boolean = true): void {
                // 	const result: any = this._viewer.clientToWorld(event.canvasX, event.canvasY, ignoreTransparent);
                // 	const hitTest: Autodesk.Viewing.Private.HitTestResult = this._viewer.impl.hitTest(event.canvasX, event.canvasY, ignoreTransparent);
                // 	const hitRay: Autodesk.Viewing.Private.HitTestResult = this._viewer.impl.rayIntersect(rayCaster, ignoreTransparent, this.dbIds)
                // }
                // Creates a mesh
                SetupTool.prototype.createPhongMaterial = function () {
                    if (SetupTool._material)
                        return (SetupTool._material);
                    SetupTool._material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                    this._viewer.impl.matman().addMaterial(SetupTool.guid(), SetupTool._material, true);
                };
                SetupTool.prototype.createSphere = function (position, radius, widthSegments) {
                    if (position === void 0) { position = new THREE.Vector3(); }
                    if (radius === void 0) { radius = 0.0001; }
                    if (widthSegments === void 0) { widthSegments = 5; }
                    var material = this.createPhongMaterial();
                    var sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, widthSegments), material);
                    sphere.position.set(position.x, position.y, position.z);
                    this._viewer.impl.scene.add(sphere);
                    return (sphere);
                };
                SetupTool.prototype.createBoundingBox = function (mesh) {
                    var box = new BoxHelper(mesh, 0xffff00);
                    //this._viewer.impl.scene.add(box);
                    //const ps: THREE.Mesh = this.createSphere(new THREE.Vector3(1, 0, 0), 2);
                    this.addToScene(box);
                    return (box);
                };
                SetupTool.guid = function () {
                    var d = new Date().getTime();
                    var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/[xy]/g, function (c) {
                        var r = (d + Math.random() * 16) % 16 | 0;
                        d = Math.floor(d / 16);
                        return ((c == 'x' ? r : (r & 0x07 | 0x08)).toString(16));
                    });
                    //THREE.MathUtils.generateUUID
                    return (guid);
                };
                // Markers
                SetupTool.prototype.createSensorMarkers = function () {
                    var that = this;
                    $('div.sensor-markers').remove();
                    // for (let key in this._poi) {
                    // 	const poi = this._poi[key];
                    // 	//var id =key.replace (/\W/g, '') ;
                    // 	const screenPoint = that.worldToScreen(poi.sensors.position, self.camera());
                    // 	//var offset =self.getClientOffset (self.container ()) ;
                    // 	$(document.createElement('div'))
                    // 		//.attr ('class', '')
                    // 		.attr('id', key)
                    // 		.attr('title', 'Sensor ID: ' + key + ' [' + poi.name + ']')
                    // 		.attr('class', 'sensor-markers')
                    // 		.css('width', '32px').css('height', '32px')
                    // 		.css('position', 'absolute').css('top', (screenPoint.y + 'px')).css('left', (screenPoint.x + 'px'))
                    // 		.css('background', 'transparent url(/images/sensortag.png) no-repeat')
                    // 		.css('pointer-events', 'auto').css('cursor', 'pointer')
                    // 		.css('z-index', '4')
                    // 		.appendTo(this.poiNavigationMenu)
                    // 		.click(function (evt) {
                    // 			evt.preventDefault();
                    // 			var sensorid = $(evt.target).attr('id');
                    // 			self.navigate(oPOI[sensorid].sensors.viewfrom, oPOI[sensorid].sensors.position);
                    // 			if (_sensorPanels[sensorid] === undefined) {
                    // 				_sensorPanels[sensorid] = new Autodesk.Viewing.Extensions.IoTTool.SensorPanel(sensorid, _self);
                    // 				_sensorPanels[sensorid].initializeFeeds();
                    // 			}
                    // 			self.activateSensorPanel(_sensorPanels[sensorid]);
                    // 		});
                    // }
                };
                ;
                SetupTool.ID = 'Autodesk.DataVisualization.Admin.SetupTool';
                SetupTool._material = null;
                return SetupTool;
            }());
            // #endregion
            // #region SetupToolExtension
            var SetupToolExtension = /** @class */ (function (_super) {
                __extends(SetupToolExtension, _super);
                function SetupToolExtension(viewer, options) {
                    var _this = _super.call(this, viewer, options) || this;
                    _this._tool = null;
                    _this._group = null;
                    _this._button = null;
                    _this.name = SetupTool.ID;
                    return _this;
                }
                // #region Protocol
                SetupToolExtension.prototype.load = function () {
                    this.initialize();
                    return (true);
                };
                SetupToolExtension.prototype.unload = function () {
                    if (this._tool)
                        this.viewer.toolController.deactivateTool(this._tool.getName());
                    // Clean our UI elements if we added any
                    if (this._group) {
                        this._group.removeControl(this._button);
                        if (this._group.getNumberOfControls() === 0)
                            this.viewer.toolbar.removeControl(this._group);
                    }
                    return (true);
                };
                SetupToolExtension.prototype.initialize = function () {
                    this._tool = new SetupTool(this.viewer, this.options);
                    this.viewer.toolController.registerTool(this._tool);
                    if (this.viewer.model.getInstanceTree())
                        this.onObjectTreeCreated();
                    else
                        this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.onObjectTreeCreated.bind(this));
                    // if (this.viewer.getToolbar(true))
                    // 	this.onToolbarCreated();
                    // else
                    // 	this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreated.bind(this));
                };
                SetupToolExtension.prototype.onObjectTreeCreated = function ( /*objetree: any[]*/) {
                    this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, /*arguments.callee as any*/ this.onObjectTreeCreated.bind(this));
                    this.viewer.toolController.activateTool(this._tool.getName());
                };
                SetupToolExtension.prototype.onToolbarCreated = function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var forgeViewer;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, /*arguments.callee as any*/ this.onToolbarCreated);
                                    forgeViewer = this.viewer._viewerController_;
                                    return [4 /*yield*/, forgeViewer.configureUI('/support/extDataVizUI.json', {})];
                                case 1:
                                    _a.sent();
                                    forgeViewer.buildUI();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
                return SetupToolExtension;
            }(Autodesk.Viewing.Extension));
            Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.DataVisualization.Tools', SetupToolExtension);
            // #endregion
        })(Admin = DataVisualization.Admin || (DataVisualization.Admin = {}));
    })(DataVisualization = Autodesk.DataVisualization || (Autodesk.DataVisualization = {}));
})(Autodesk || (Autodesk = {}));
//# sourceMappingURL=Autodesk.DataVisualization.Admin.js.map