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
var MyExtension1 = /** @class */ (function (_super) {
    __extends(MyExtension1, _super);
    function MyExtension1(viewer, options) {
        var _this = _super.call(this, viewer, options) || this;
        _this.rootNode = null;
        _this.currentNode = null;
        _this.panel = null;
        _this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_PRE_UNLOADED_EVENT, _this.onExtensionPreUnloaded.bind(_this));
        return _this;
    }
    MyExtension1.prototype.load = function () {
        console.log('MyExtension1Panel has been loaded');
        this.viewer.setEnvMapBackground(null); // Hide background environment if there is one
        //this.viewer.setBackgroundColor(0, 64, 128); // Set background color
        return (true);
    };
    MyExtension1.prototype.unload = function () {
        console.log('MyExtension1Panel has been unloaded');
        // Wolfgang option #1
        this.panel.uninitialize(); // deletes the DOM elements
        delete this.panel; // deletes the javascript object
        this.panel = null; // not really needed, but...
        return (true);
    };
    MyExtension1.prototype.onToolbarCreated = function (toolbar) {
    };
    MyExtension1.prototype.loadNextModel = function (viewerConfig, loadOptions) {
        if (!this.currentNode)
            return;
        //this.viewer.loadDocumentNode(this.rootNode.getDocument(), nextNode, loadOptions);
    };
    MyExtension1.prototype.onExtensionPreUnloaded = function (extensionInfo) {
        if (extensionInfo.extensionId === 'Autodesk.MyExtension1' && this.panel) {
            // time to cleanup
            //this.panel.setVisible(false);
            // Wolfgang option #2
            // this.panel.uninitialize(); // deletes the DOM elements
            // delete this.panel; // deletes the javascript object
            // this.panel = null; // not really needed, but...
        }
    };
    MyExtension1.prototype.getPanel = function () {
        if (!this.panel)
            this.panel = new MyExtension1Panel(this.viewer.container, 'MyExtension1Panel', 'My Extension1 Panel', {
                addFooter: true,
            });
        this.panel.setVisible(!this.panel.isVisible());
    };
    return MyExtension1;
}(Autodesk.Viewing.Extension));
var MyExtension1Panel = /** @class */ (function (_super) {
    __extends(MyExtension1Panel, _super);
    function MyExtension1Panel(parentContainer, id, title, options) {
        return _super.call(this, parentContainer, id, title, options) || this;
    }
    MyExtension1Panel.prototype.initialize = function () {
        _super.prototype.initialize.call(this);
        this.initializeMoveHandlers(this.container);
        this.container.classList.add('docking-panel-container-solid-color-a');
        this.container.style.top = "10px";
        this.container.style.left = "10px";
        this.container.style.width = "auto";
        this.container.style.height = "auto";
        this.container.style.resize = "auto";
        this.createScrollContainer();
        var div = document.createElement('div');
        div.style.margin = '20px';
        div.innerText = "My content here";
        //this.container.appendChild(div);
        this.scrollContainer.appendChild(div);
    };
    MyExtension1Panel.prototype.uninitialize = function () {
        _super.prototype.uninitialize.call(this);
    };
    return MyExtension1Panel;
}(Autodesk.Viewing.UI.DockingPanel));
Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.MyExtension1', MyExtension1);
//# sourceMappingURL=wolfgang-ext1.js.map