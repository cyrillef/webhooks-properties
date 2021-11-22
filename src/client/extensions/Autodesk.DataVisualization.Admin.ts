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

//import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
//import * as MeshLine from '../../../www/js/THREE.MeshLine.js'


//AutodeskNamespace('Autodesk.DataVisualization.Admin');

namespace Autodesk.DataVisualization.Admin {

	const Vector3FromBufferAttribute = (attribute: THREE.BufferAttribute, index: number, offset?: number): THREE.Vector3 => {
		if (offset !== undefined)
			console.warn('THREE.Vector3: offset has been removed from .fromBufferAttribute().');
		return (new THREE.Vector3(
			// attribute.getX(index),
			// attribute.getY(index),
			// attribute.getZ(index)
			attribute.array[index * attribute.itemSize],
			attribute.array[index * attribute.itemSize + 1],
			attribute.array[index * attribute.itemSize + 2]
		));
	}

	class Float32BufferAttribute extends THREE.BufferAttribute {

		constructor(array: any, itemSize: number, normalized?: boolean) {
			super(new Float32Array(array), itemSize/*, normalized*/);
		}

	}

	class LineSegments extends THREE.Line {

		protected static _start = new THREE.Vector3();
		protected static _end = new THREE.Vector3();

		constructor(geometry?: THREE.Geometry | THREE.BufferGeometry, material?: THREE.LineDashedMaterial | THREE.LineBasicMaterial | THREE.ShaderMaterial) {
			super(geometry, material);
			this.type = 'LineSegments';
		}

		public computeLineDistances(): LineSegments {
			const geometry: THREE.Geometry | THREE.BufferGeometry = this.geometry;
			if ((geometry as any).isBufferGeometry) {
				// we assume non-indexed geometry
				const _geometry: THREE.BufferGeometry = (geometry as THREE.BufferGeometry);
				if (_geometry.index === null) {
					const positionAttribute = (_geometry.attributes as any).position;
					const lineDistances: number[] = [];
					for (let i = 0, l = positionAttribute.count; i < l; i += 2) {
						LineSegments._start = Vector3FromBufferAttribute(positionAttribute, i);
						LineSegments._end = Vector3FromBufferAttribute(positionAttribute, i + 1);
						lineDistances[i] = (i === 0) ? 0 : lineDistances[i - 1];
						lineDistances[i + 1] = lineDistances[i] + LineSegments._start.distanceTo(LineSegments._end);
					}
					//(_geometry as any).setAttribute('lineDistance', new Float32BufferAttribute(lineDistances, 1));
					(_geometry.attributes as any).lineDistance = new Float32BufferAttribute(lineDistances, 1);
				} else {
					console.warn('THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.');
				}
			} else if ((geometry as any).isGeometry) {
				console.error('THREE.LineSegments.computeLineDistances() no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.');
			}
			return (this);
		}

	}

	if (!THREE.BufferGeometry.prototype.setAttribute)
		THREE.BufferGeometry.prototype.setAttribute = function (name: string, attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.BufferGeometry {
			this.attributes[name] = attribute;
			return (this);
		};


	// THREE.Box3.prototype.setFromObject = function (object: THREE.Object3D): THREE.Box3 {
	// 	this.makeEmpty();
	// 	return (this.expandByObject(object));
	// }


	class BoxHelper extends LineSegments {

		protected static _box = new THREE.Box3();
		protected _material: THREE.LineBasicMaterial;

		constructor(object: THREE.Object3D, color: number = 0x00ffff) {
			const indices: Uint16Array = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]);
			const positions: Float32Array = new Float32Array(8 * 3);
			const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
			geometry.setIndex(new THREE.BufferAttribute(indices, 1));
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			const material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: color/*, toneMapped: false*/ });
			//viewer.impl.matman().addMaterial(SetupTool.guid(), material, true);
			super(geometry, material);

			this._material = material;
			this._object = object;
			this.type = 'BoxHelper';
			this.matrixAutoUpdate = false;
			//this.mode = _gl.LINES;
			//const _gl: any = NOP_VIEWER.impl.canvas.getContext('webgl2');
			(this as any).mode = 1; // _gl.LINES=1 ; _gl.LINE_STRIP=3
			this.update();
		}

		public get _object(): THREE.Object3D { return ((this as any).object); }
		public set _object(object: THREE.Object3D) { (this as any).object = object; }
		public get lineMaterial(): THREE.LineBasicMaterial { return (this._material); }

		public update(object?: THREE.Object3D): void {
			if (object !== undefined)
				console.warn('THREE.BoxHelper: .update() has no longer arguments.');
			if (this._object !== undefined)
				BoxHelper._box.setFromObject(this._object);
			if (BoxHelper._box.isEmpty())
				return;
			const min = BoxHelper._box.min;
			const max = BoxHelper._box.max;
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

			const position: THREE.BufferAttribute = <THREE.BufferAttribute>(this.geometry as THREE.BufferGeometry).getAttribute('position');
			const array = position.array;
			array[0] = max.x; array[1] = max.y; array[2] = max.z;
			array[3] = min.x; array[4] = max.y; array[5] = max.z;
			array[6] = min.x; array[7] = min.y; array[8] = max.z;
			array[9] = max.x; array[10] = min.y; array[11] = max.z;
			array[12] = max.x; array[13] = max.y; array[14] = min.z;
			array[15] = min.x; array[16] = max.y; array[17] = min.z;
			array[18] = min.x; array[19] = min.y; array[20] = min.z;
			array[21] = max.x; array[22] = min.y; array[23] = min.z;
			position.needsUpdate = true;
			this.geometry.computeBoundingSphere();
			this.geometry.computeBoundingBox();
		}

		public setFromObject(object?: THREE.Object3D): BoxHelper {
			this._object = object;
			this.update();
			return (this);
		}

		public copy(source: any): BoxHelper {
			THREE.LineSegments.prototype.copy.call(this, source);
			this._object = source.object;
			return (this);
		}

	}

	// #region SetupTool
	class SetupTool implements Autodesk.Viewing.IToolInterface {

		public static readonly ID = 'Autodesk.DataVisualization.Admin.SetupTool';
		private static _material: THREE.MeshPhongMaterial = null;

		private _viewer: Autodesk.Viewing.Viewer3D = null;
		private _options: any = null;
		private _overlayScene: string = "DataVisualizationSetupToolOverlay";
		private _hitTest: Autodesk.Viewing.Private.HitTestResult = null;

		private _lineMaterial: THREE.LineBasicMaterial = null;

		constructor(viewer: Autodesk.Viewing.Viewer3D, options?: any) {
			this._viewer = viewer;
			this._options = options;
		}

		// #region Protocol
		protected static get extensionId() {
			return (SetupTool.ID);
		}

		/**
		 * This method should return an array containing the names of all tools implemented by this class.
		 * Often this would be a single name but it is possible to support multiple interactions with a single tool.
		 * When this tool is registered with the ToolController each name gets registered as an available tool.
		 *
		 * @returns {Array} Array of strings. Should not be empty.
		 */
		public getNames(): string[] {
			return ([SetupTool.extensionId]);
		}

		/**
		 * This is an optional convenience method to obtain the first name of this tool.
		 *
		 * @returns {string} The tools default name.
		 */
		public getName(): string {
			return (SetupTool.extensionId);
		}

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
		public register(): void {
		}

		/**
		 * This method is called by {@link Autodesk.Viewing.ToolController#deregisterTool}.
		 * Use this to clean up your tool.
		 */
		public deregister(): void {
		}

		/**
		 * The activate method is called by the ToolController when it adds this tool to the list of those
		 * to receive event handling calls. Once activated, a tool's "handle*" methods may be called
		 * if no other higher priority tool handles the given event. Each active tool's "update" method also gets
		 * called once during each redraw loop.
		 *
		 * @param {string} name - The name under which the tool has been activated.
		 * @param {Autodesk.Viewing.Viewer3D} viewerApi - Viewer instance.
		 */
		public activate(name: string, viewer?: Autodesk.Viewing.Viewer3D): void {
			this._viewer = viewer || this._viewer;
			this.createOverlay();
			this._lineMaterial = this.createLineMaterial();
			//this.viewer.select([]);
			//const bbox: THREE.Box3 = this.viewer.model.getBoundingBox();
		}

		/**
		 * The deactivate method is called by the ToolController when it removes this tool from the list of those
		 * to receive event handling calls. Once deactivated, a tool's "handle*" methods and "update" method
		 * will no longer be called.
		 *
		 * @param {string} name - The name under which the tool has been deactivated.
		 */
		public deactivate(name: string): void {
			this._lineMaterial = null;
			this.deleteOverlay();
		}

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
		public update(highResTimestamp?: number): boolean {
			return (false);
		}

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
		protected createOverlay(): any {
			return (this._viewer.impl.createOverlayScene(this._overlayScene));
		}

		protected deleteOverlay(): any {
			return (this._viewer.impl.removeOverlayScene(this._overlayScene));
		}

		private createLineMaterial(color: number = 0x00ffff, linewidth: number = 15): THREE.LineBasicMaterial {
			const material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial(//{ color: color/*, toneMapped: false*/ });
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
		}

		private _useOverlay: boolean = true;

		private addToScene(obj: THREE.Object3D | THREE.Object3D[]): void {
			if (!Array.isArray(obj))
				obj = [obj];
			obj.map((elt: THREE.Object3D): void => {
				if (!this._useOverlay) {
					this._viewer.impl.scene.add(elt);
					this._viewer.impl.invalidate(true, true, false);
				} else {
					this._viewer.impl.addOverlay(this._overlayScene, elt);
					this._viewer.impl.invalidate(false, false, true);
				}
				//this._toRemove.push(obj);
			});
		}

		private removeFromScene(obj: THREE.Object3D | THREE.Object3D[]): void {
			if (!Array.isArray(obj))
				obj = [obj];
			obj.map((elt: THREE.Object3D): void => {
				if (!this._useOverlay) {
					this._viewer.impl.scene.remove(elt);
					this._viewer.impl.invalidate(true, true, false);
				} else {
					this._viewer.impl.removeOverlay(this._overlayScene, elt);
					this._viewer.impl.invalidate(false, false, true);
				}
			});
		}

		public handleSingleClick(event: Autodesk.Viewing.ForgeMouseEvent, button: number): boolean {
			//console.log(event);
			this._hitTest = this.getHitObject(event);
			if (!this._hitTest)
				return (false);

			// const bbox: THREE.Box3 = this.getBoundingBox(this._hitTest.dbId);
			const fragList: Autodesk.Viewing.Private.FragmentList = this._viewer.model.getFragmentList();

			// const fragProxy: any = this._viewer.impl.getFragmentProxy(this._viewer.model, this._hitTest.fragId);
			const renderProxy: any = this._viewer.impl.getRenderProxy(this._viewer.model, this._hitTest.fragId);
			// fragProxy.getAnimTransform();
			const geometry: any = renderProxy.geometry;
			const attributes: any = geometry.attributes;
			attributes.position.array = geometry.vb

			const gg = fragList.getVizmesh(this._hitTest.fragId);


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

			const pts = [
				0, 0, 0,
				10, 10, 10,
				10, 15, 10,
				20, 10, 20
			];

			// @ts-ignore
			const line = new MeshLine();
			// line.setPoints(pts);

			let geometryCore = new THREE.Geometry();
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

			const dims = this._viewer.getDimensions();
			const resolution = new THREE.Vector2(dims.width, dims.height);
			//(vp, 50);

			// @ts-ignore
			const material = new MeshLineMaterial({
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
			
			const lineMesh = new THREE.Mesh(line.geometry, material);
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
		}

		public handleSingleClick1(event: Autodesk.Viewing.ForgeMouseEvent, button: number): boolean {
			//console.log(event);
			this._hitTest = this.getHitObject(event);
			if (!this._hitTest)
				return (false);

			// const bbox: THREE.Box3 = this.getBoundingBox(this._hitTest.dbId);
			const fragList: Autodesk.Viewing.Private.FragmentList = this._viewer.model.getFragmentList();

			// const fragProxy: any = this._viewer.impl.getFragmentProxy(this._viewer.model, this._hitTest.fragId);
			const renderProxy: any = this._viewer.impl.getRenderProxy(this._viewer.model, this._hitTest.fragId);
			// fragProxy.getAnimTransform();
			const geometry: any = renderProxy.geometry;
			const attributes: any = geometry.attributes;
			attributes.position.array = geometry.vb

			const gg = fragList.getVizmesh(this._hitTest.fragId);


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

			let vertsNonIndexed = new Float32Array(3 * 4);
			vertsNonIndexed.set([
				0, 0, 0,
				10, 10, 10,
				20, 10, 20,
				1, 10, 1
			]);


			// let geometryl = new THREE.BufferGeometry();
			// geometryl.setAttribute('position', new THREE.BufferAttribute(vertsNonIndexed, 3));
			// geometryl.computeVertexNormals();


			const lineIndices = new Uint32Array([
				0, 1,
				0, 2,
				0, 3
			]);

			let lineGeom = new THREE.BufferGeometry();
			lineGeom.setIndex(new THREE.BufferAttribute(lineIndices, 1));
			lineGeom.setAttribute('position', new THREE.BufferAttribute(vertsNonIndexed, 3));
			(lineGeom as any).isLines = true;

			const lineMesh = new THREE.Mesh(lineGeom, this._lineMaterial);
			this.addToScene(lineMesh);


			return (false);
		}

		public raytrace(psource: THREE.Vector3, vray: THREE.Vector3, max_dist: number, meshes: THREE.Object3D[]): THREE.Intersection[] {
			const ray: THREE.Raycaster = new THREE.Raycaster(psource, vray, 0, max_dist);
			const intersectResults: THREE.Intersection[] = ray.intersectObjects(meshes, true);
			return (intersectResults);
		}

		protected getHitPoint(event: MouseEvent): THREE.Vector3 {
			let screenPoint: THREE.Vector2 = new THREE.Vector2(event.clientX, event.clientY);
			screenPoint = this.normalizeCoordinates(screenPoint);
			const viewer: Autodesk.Viewing.GuiViewer3D = this._viewer as Autodesk.Viewing.GuiViewer3D;
			const hitPoint: THREE.Vector3 = viewer.utilities.getHitPoint(screenPoint.x, screenPoint.y);
			return (hitPoint);
		}

		protected getHitObject(event: Autodesk.Viewing.ForgeMouseEvent): Autodesk.Viewing.Private.HitTestResult {
			// let screenPoint: THREE.Vector2 = new THREE.Vector2(event.clientX, event.clientY);
			// screenPoint = this.normalizeCoordinates(screenPoint);
			// const viewer: Autodesk.Viewing.GuiViewer3D = this._viewer as Autodesk.Viewing.GuiViewer3D;

			const screenPoint: THREE.Vector2 = new THREE.Vector2(event.canvasX, event.canvasY);
			const hitTest: Autodesk.Viewing.Private.HitTestResult = this._viewer.impl.hitTest(screenPoint.x, screenPoint.y, true);
			return (hitTest);
		}

		protected normalizeCoordinates(screenPoint: THREE.Vector2): THREE.Vector2 {
			const viewport = this._viewer.navigation.getScreenViewport();
			return (new THREE.Vector2(
				(screenPoint.x - viewport.left) / viewport.width,
				(screenPoint.y - viewport.top) / viewport.height
			));
		}

		// Bounding Box
		// https://forge.autodesk.com/blog/working-2d-and-3d-scenes-and-geometry-forge-viewer
		public getBoundingBox(dbId: number): THREE.Box3 {
			// this._viewer.model.getBoundingBox () // full model bounding box
			// We need the Object bounding box, not the model
			const bounds: THREE.Box3 = new THREE.Box3();
			const box: THREE.Box3 = new THREE.Box3();
			const instanceTree: any = this._viewer.model.getData().instanceTree;
			const fragList: Autodesk.Viewing.Private.FragmentList = this._viewer.model.getFragmentList();
			instanceTree.enumNodeFragments(
				dbId,
				(fragId: number): void => {
					fragList.getWorldBounds(fragId, box);
					bounds.union(box);
				},
				true
			);
			//console.log (bounds) ;
			return (bounds);
		}

		public findBoundingBoxCenters(dbId: number, bounds?: THREE.Box3): THREE.Vector3[] {
			bounds = bounds || this.getBoundingBox(dbId);
			const center: THREE.Vector3 = bounds.center();
			const size: THREE.Vector3 = bounds.size();
			const up: THREE.Vector3 = this._viewer.navigation.getWorldUpVector();
			const faceCenters = []; // This is sensors possible places
			if (up.x === 0) {
				let pt = center.clone(); pt.x += size.x / 2; faceCenters.push(pt);
				pt = center.clone(); pt.x -= size.x / 2; faceCenters.push(pt);
			}
			if (up.y === 0) {
				let pt = center.clone(); pt.y += size.y / 2; faceCenters.push(pt);
				pt = center.clone(); pt.y -= size.y / 2; faceCenters.push(pt);
			}
			if (up.z === 0) {
				let pt = center.clone(); pt.z += size.z / 2; faceCenters.push(pt);
				pt = center.clone(); pt.z -= size.z / 2; faceCenters.push(pt);
			}
			return (faceCenters);
		}

		public findPOIFromBoundingBox(dbId: number, dist: number = 5, camera: any): THREE.Vector3 {
			const bounds: THREE.Box3 = this.getBoundingBox(dbId);
			const faceCenters = this.findBoundingBoxCenters(dbId, bounds);
			// Now choose the closest to the camera viewpoint
			camera = camera || this._viewer.navigation.getCamera();
			let d0 = -1, i0 = -1;
			for (let i = 0; i < faceCenters.length; i++) {
				let d = camera.position.distanceTo(faceCenters[i]);
				if (i0 === -1 || d < d0) {
					i0 = i;
					d0 = d;
				}
			}
			const position = faceCenters[i0].clone();
			const viewDir = bounds.center().clone().sub(position).normalize();
			position.sub(viewDir.multiplyScalar(dist));
			return (position);
		}

		// Utilities
		// protected xx(event: Autodesk.Viewing.ForgeMouseEvent, ignoreTransparent: boolean = true): void {
		// 	const result: any = this._viewer.clientToWorld(event.canvasX, event.canvasY, ignoreTransparent);
		// 	const hitTest: Autodesk.Viewing.Private.HitTestResult = this._viewer.impl.hitTest(event.canvasX, event.canvasY, ignoreTransparent);
		// 	const hitRay: Autodesk.Viewing.Private.HitTestResult = this._viewer.impl.rayIntersect(rayCaster, ignoreTransparent, this.dbIds)
		// }

		// Creates a mesh
		protected createPhongMaterial(): THREE.MeshPhongMaterial {
			if (SetupTool._material)
				return (SetupTool._material);
			SetupTool._material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
			this._viewer.impl.matman().addMaterial(SetupTool.guid(), SetupTool._material, true);
		}

		protected createSphere(position: THREE.Vector3 = new THREE.Vector3(), radius: number = 0.0001, widthSegments: number | undefined = 5): THREE.Mesh {
			const material = this.createPhongMaterial();
			const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, widthSegments), material);
			sphere.position.set(position.x, position.y, position.z);
			this._viewer.impl.scene.add(sphere);
			return (sphere);
		}

		protected createBoundingBox(mesh: THREE.Mesh): BoxHelper {
			const box: BoxHelper = new BoxHelper(mesh, 0xffff00);
			//this._viewer.impl.scene.add(box);

			//const ps: THREE.Mesh = this.createSphere(new THREE.Vector3(1, 0, 0), 2);
			this.addToScene(box);

			return (box);
		}

		protected static guid(): string {
			let d: number = new Date().getTime();
			const guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
				/[xy]/g,
				(c) => {
					const r: number = (d + Math.random() * 16) % 16 | 0;
					d = Math.floor(d / 16);
					return ((c == 'x' ? r : (r & 0x07 | 0x08)).toString(16));
				}
			);
			//THREE.MathUtils.generateUUID
			return (guid);
		}

		// Markers
		protected createSensorMarkers() {
			const that: SetupTool = this;
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

		// #endregion

	}

	// #endregion

	// #region SetupToolExtension
	class SetupToolExtension extends Autodesk.Viewing.Extension {

		private _tool: SetupTool = null;
		private _group: any = null;
		private _button: any = null;

		constructor(viewer: Autodesk.Viewing.GuiViewer3D, options?: any) {
			super(viewer, options);
			this.name = SetupTool.ID;
		}

		// #region Protocol
		public load(): boolean {
			this.initialize();
			return (true);
		}

		public unload(): boolean {
			if (this._tool)
				this.viewer.toolController.deactivateTool(this._tool.getName());
			// Clean our UI elements if we added any
			if (this._group) {
				this._group.removeControl(this._button);
				if (this._group.getNumberOfControls() === 0)
					this.viewer.toolbar.removeControl(this._group);
			}
			return (true);
		}

		protected initialize(): void {
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
		}

		protected onObjectTreeCreated(/*objetree: any[]*/): void {
			this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, /*arguments.callee as any*/this.onObjectTreeCreated.bind(this));
			this.viewer.toolController.activateTool(this._tool.getName());
		}

		public async onToolbarCreated(): Promise<void> {
			this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, /*arguments.callee as any*/this.onToolbarCreated);
			const forgeViewer: ForgeViewer = (this.viewer as any)._viewerController_ as ForgeViewer;
			await forgeViewer.configureUI(
				'/support/extDataVizUI.json',
				{

				}
			);
			forgeViewer.buildUI();
		}

		// #endregion

		// #region Events
		// public onToolbarCreated() {
		// }

		// #endregion

	}

	Autodesk.Viewing.theExtensionManager.registerExtension('Autodesk.DataVisualization.Tools', SetupToolExtension);

	// #endregion

}
