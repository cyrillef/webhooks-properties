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
var TransformTool = /** @class */ (function () {
    function TransformTool(viewer, options) {
        this.viewer = null;
        this.options = null;
        this._hitPoint = null;
        this._isDragging = false;
        this._transformMesh = null;
        this._modifiedFragIdMap = {};
        this._selectedFragProxyMap = {};
        this._transformControlTx = null;
        this.viewer = viewer;
        this.options = options;
    }
    TransformTool.prototype.getNames = function () {
        return (['Dotty.Viewing.Tool.TransformTool']);
    };
    TransformTool.prototype.getName = function () {
        return ('Dotty.Viewing.Tool.TransformTool');
    };
    TransformTool.prototype.activate = function () {
        this.viewer.select([]);
        var bbox = this.viewer.model.getBoundingBox();
        this.viewer.impl.createOverlayScene('Dotty.Viewing.Tool.TransformTool');
        this._transformControlTx = new THREE.TransformControls(this.viewer.impl.camera, this.viewer.impl.canvas);
        this._transformControlTx.setSize(bbox.getBoundingSphere(null).radius * 5);
        this._transformControlTx.visible = false;
        this.viewer.impl.addOverlay('Dotty.Viewing.Tool.TransformTool', this._transformControlTx);
        this._transformMesh = this.createTransformMesh();
        this._transformControlTx.attach(this._transformMesh);
        this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onItemSelected.bind(this));
    };
    TransformTool.prototype.deactivate = function () {
        this.viewer.impl.removeOverlay('Dotty.Viewing.Tool.TransformTool', this._transformControlTx);
        this._transformControlTx.removeEventListener('change', this.onTxChange);
        this._transformControlTx = null;
        this.viewer.impl.removeOverlayScene('Dotty.Viewing.Tool.TransformTool');
        this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChanged);
        this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onItemSelected);
    };
    TransformTool.prototype.update = function (t) {
        return (false);
    };
    TransformTool.prototype.onItemSelected = function (event) {
        var _this = this;
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
            event.fragIdsArray.forEach(function (fragId) {
                var fragProxy = _this.viewer.impl.getFragmentProxy(_this.viewer.model, fragId);
                fragProxy.getAnimTransform();
                var offset = {
                    x: _this._hitPoint.x - fragProxy.position.x,
                    y: _this._hitPoint.y - fragProxy.position.y,
                    z: _this._hitPoint.z - fragProxy.position.z
                };
                fragProxy.offset = offset;
                _this._selectedFragProxyMap[fragId] = fragProxy;
                _this._modifiedFragIdMap[fragId] = {};
            });
            this._hitPoint = null;
        }
        else {
            this._transformControlTx.visible = false;
        }
    };
    TransformTool.prototype.onTxChange = function () {
        for (var fragId in this._selectedFragProxyMap) {
            var fragProxy = this._selectedFragProxyMap[fragId];
            var position = new THREE.Vector3(this._transformMesh.position.x - fragProxy.offset.x, this._transformMesh.position.y - fragProxy.offset.y, this._transformMesh.position.z - fragProxy.offset.z);
            fragProxy.position = position;
            fragProxy.updateAnimTransform();
        }
        this.viewer.impl.sceneUpdated(true);
    };
    TransformTool.prototype.onCameraChanged = function () {
        this._transformControlTx.update();
    };
    TransformTool.prototype.handleSingleClick = function (event, button) {
        return (false);
    };
    TransformTool.prototype.handleDoubleClick = function (event, button) {
        return (false);
    };
    TransformTool.prototype.handleSingleTap = function (event) {
        return (false);
    };
    TransformTool.prototype.handleDoubleTap = function (event) {
        return (false);
    };
    TransformTool.prototype.handleKeyDown = function (event, keyCode) {
        return (false);
    };
    TransformTool.prototype.handleKeyUp = function (event, keyCode) {
        return (false);
    };
    TransformTool.prototype.handleWheelInput = function (delta) {
        return (false);
    };
    TransformTool.prototype.handleButtonDown = function (event, button) {
        this._hitPoint = this.getHitPoint(event);
        this._isDragging = true;
        if (this._transformControlTx.onPointerDown(event))
            return (true);
        //return (this._transRotControl.onPointerDown(event));
        return (false);
    };
    TransformTool.prototype.handleButtonUp = function (event, button) {
        this._isDragging = false;
        if (this._transformControlTx.onPointerUp(event))
            return (true);
        //return (this._transRotControl.onPointerUp(event));
        return (false);
    };
    TransformTool.prototype.handleMouseMove = function (event) {
        if (this._isDragging) {
            if (this._transformControlTx.onPointerMove(event))
                return (true);
            return (false);
        }
        if (this._transformControlTx.onPointerHover(event))
            return (true);
        //return (this._transRotControl.onPointerHover(event));
        return (false);
    };
    TransformTool.prototype.handleGesture = function (event) {
        return (false);
    };
    TransformTool.prototype.handleBlur = function (event) {
        return (false);
    };
    TransformTool.prototype.handleResize = function () {
        return (false);
    };
    TransformTool.prototype.getHitPoint = function (event) {
        var screenPoint = new THREE.Vector2(event.clientX, event.clientY);
        screenPoint = this.normalize(screenPoint);
        var hitPoint = this.viewer.utilities.getHitPoint(screenPoint.x, screenPoint.y);
        return (hitPoint);
    };
    TransformTool.prototype.normalize = function (screenPoint) {
        var viewport = this.viewer.navigation.getScreenViewport();
        return (new THREE.Vector2((screenPoint.x - viewport.left) / viewport.width, (screenPoint.y - viewport.top) / viewport.height));
    };
    TransformTool.prototype.getTransformMap = function () {
        var transformMap = {};
        for (var fragId in this._modifiedFragIdMap) {
            var fragProxy = this.viewer.impl.getFragmentProxy(this.viewer.model, parseInt(fragId));
            fragProxy.getAnimTransform();
            transformMap[fragId] = {
                position: fragProxy.position
            };
            fragProxy = null;
        }
        return (transformMap);
    };
    TransformTool.guid = function () {
        var d = new Date().getTime();
        var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return ((c == 'x' ? r : (r & 0x7 | 0x8)).toString(16));
        });
        return (guid);
    };
    // Creates a dummy mesh to attach control to
    TransformTool.prototype.createTransformMesh = function () {
        var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.viewer.impl.matman().addMaterial(TransformTool.guid(), material, true);
        var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.0001, 5), material);
        sphere.position.set(0, 0, 0);
        return (sphere);
    };
    return TransformTool;
}());
var TransformExtension = /** @class */ (function (_super) {
    __extends(TransformExtension, _super);
    function TransformExtension(viewer, options) {
        var _this = _super.call(this, viewer, options) || this;
        _this.tool = null;
        _this.toolactivated = false;
        _this._group = null;
        _this._button = null;
        return _this;
    }
    TransformExtension.prototype.load = function () {
        return (true);
    };
    TransformExtension.prototype.unload = function () {
        if (this.tool)
            this.viewer.toolController.deactivateTool(this.tool.getName());
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0)
                this.viewer.toolbar.removeControl(this._group);
        }
        return (true);
    };
    TransformExtension.prototype.initialize = function () {
        this.tool = new TransformTool(this.viewer, this.options);
        this.viewer.toolController.registerTool(this.tool);
        if (this.viewer.model.getInstanceTree())
            this.customize();
        else
            this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.customize.bind(this));
    };
    TransformExtension.prototype.customize = function () {
        this.viewer.toolController.activateTool(this.tool.getName());
    };
    TransformExtension.prototype.onToolbarCreated = function () {
        var _this = this;
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('transformExtensionsToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('transformExtensionsToolbar');
            this.viewer.toolbar.addControl(this._group);
        }
        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('transformExtensionButton');
        this._button.onClick = function (ev) {
            // Execute an action here
            if (!_this.toolactivated) {
                _this.initialize();
                _this.toolactivated = true;
            }
            else {
                _this.viewer.toolController.deactivateTool(_this.tool.getName());
                _this.toolactivated = false;
            }
        };
        this._button.setToolTip('Transform Extension');
        this._button.addClass('transformextensionicon');
        this._group.addControl(this._button);
    };
    return TransformExtension;
}(Autodesk.Viewing.Extension));
Autodesk.Viewing.AutodeskNamespace('Autodesk.ADN.Viewing.Extensions');
Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.ADN.Viewing.Extensions.TransformTool', TransformTool);
//# sourceMappingURL=transform-tool.js.map