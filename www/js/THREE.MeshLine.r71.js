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
var MeshLine = /** @class */ (function () {
    function MeshLine() {
        this.previous = [];
        this.next = [];
        this.side = [];
        this.width = [];
        this.counters = [];
        this.geometry = new THREE.BufferGeometry();
        this.positions = [];
        this.indicesArray = [];
        this.uvs = [];
        this.positions = [];
        this.previous = [];
        this.next = [];
        this.side = [];
        this.width = [];
        this.indicesArray = [];
        this.uvs = [];
        this.counters = [];
        this.geometry = new THREE.BufferGeometry();
    }
    MeshLine.prototype.setGeometry = function (g, c) {
        this.widthCallback = c;
        this.positions = [];
        this.counters = [];
        if (g instanceof THREE.Geometry) {
            for (var j = 0; j < g.vertices.length; j++) {
                var v = g.vertices[j];
                var c2 = j / g.vertices.length;
                this.positions.push(v.x, v.y, v.z);
                this.positions.push(v.x, v.y, v.z);
                this.counters.push(c2);
                this.counters.push(c2);
            }
        }
        if (g instanceof THREE.BufferGeometry) {
            // read attribute positions ?
        }
        if (g instanceof Float32Array || g instanceof Array) {
            for (var j = 0; j < g.length; j += 3) {
                var c2 = j / g.length;
                this.positions.push(g[j], g[j + 1], g[j + 2]);
                this.positions.push(g[j], g[j + 1], g[j + 2]);
                this.counters.push(c2);
                this.counters.push(c2);
            }
        }
        this.process();
    };
    MeshLine.prototype.compareV3 = function (a, b) {
        var aa = a * 6;
        var ab = b * 6;
        return (this.positions[aa] === this.positions[ab]) && (this.positions[aa + 1] === this.positions[ab + 1]) && (this.positions[aa + 2] === this.positions[ab + 2]);
    };
    MeshLine.prototype.copyV3 = function (a) {
        var aa = a * 6;
        return ([this.positions[aa], this.positions[aa + 1], this.positions[aa + 2]]);
    };
    MeshLine.prototype.process = function () {
        var l = this.positions.length / 6;
        this.previous = [];
        this.next = [];
        this.side = [];
        this.width = [];
        this.indicesArray = [];
        this.uvs = [];
        for (var j = 0; j < l; j++) {
            this.side.push(1);
            this.side.push(-1);
        }
        var w;
        for (var j = 0; j < l; j++) {
            w = this.widthCallback ? this.widthCallback(j / (l - 1)) : 1;
            this.width.push(w);
            this.width.push(w);
        }
        for (var j = 0; j < l; j++) {
            this.uvs.push(j / (l - 1), 0);
            this.uvs.push(j / (l - 1), 1);
        }
        var v;
        if (this.compareV3(0, l - 1)) {
            v = this.copyV3(l - 2);
        }
        else {
            v = this.copyV3(0);
        }
        this.previous.push(v[0], v[1], v[2]);
        this.previous.push(v[0], v[1], v[2]);
        for (var j = 0; j < l - 1; j++) {
            v = this.copyV3(j);
            this.previous.push(v[0], v[1], v[2]);
            this.previous.push(v[0], v[1], v[2]);
        }
        for (var j = 1; j < l; j++) {
            v = this.copyV3(j);
            this.next.push(v[0], v[1], v[2]);
            this.next.push(v[0], v[1], v[2]);
        }
        if (this.compareV3(l - 1, 0)) {
            v = this.copyV3(1);
        }
        else {
            v = this.copyV3(l - 1);
        }
        this.next.push(v[0], v[1], v[2]);
        this.next.push(v[0], v[1], v[2]);
        for (var j = 0; j < l - 1; j++) {
            var n = j * 2;
            this.indicesArray.push(n, n + 1, n + 2);
            this.indicesArray.push(n + 2, n + 1, n + 3);
        }
        if (!this.attributes) {
            this.attributes = {
                position: new THREE.BufferAttribute(new Float32Array(this.positions), 3),
                previous: new THREE.BufferAttribute(new Float32Array(this.previous), 3),
                next: new THREE.BufferAttribute(new Float32Array(this.next), 3),
                side: new THREE.BufferAttribute(new Float32Array(this.side), 1),
                width: new THREE.BufferAttribute(new Float32Array(this.width), 1),
                uv: new THREE.BufferAttribute(new Float32Array(this.uvs), 2),
                index: new THREE.BufferAttribute(new Uint16Array(this.indicesArray), 1),
                counters: new THREE.BufferAttribute(new Float32Array(this.counters), 1)
            };
        }
        else {
            this.attributes.position.set(new Float32Array(this.positions));
            this.attributes.position.needsUpdate = true;
            this.attributes.previous.set(new Float32Array(this.previous));
            this.attributes.previous.needsUpdate = true;
            this.attributes.next.set(new Float32Array(this.next));
            this.attributes.next.needsUpdate = true;
            this.attributes.side.set(new Float32Array(this.side));
            this.attributes.side.needsUpdate = true;
            this.attributes.width.set(new Float32Array(this.width));
            this.attributes.width.needsUpdate = true;
            this.attributes.uv.set(new Float32Array(this.uvs));
            this.attributes.uv.needsUpdate = true;
            this.attributes.index.set(new Uint16Array(this.indicesArray));
            this.attributes.index.needsUpdate = true;
        }
        this.geometry.setAttribute('position', this.attributes.position);
        this.geometry.setAttribute('previous', this.attributes.previous);
        this.geometry.setAttribute('next', this.attributes.next);
        this.geometry.setAttribute('side', this.attributes.side);
        this.geometry.setAttribute('width', this.attributes.width);
        this.geometry.setAttribute('uv', this.attributes.uv);
        this.geometry.setAttribute('counters', this.attributes.counters);
        this.geometry.setAttribute('index', this.attributes.index);
    };
    MeshLine.prototype.memcpy = function (src, srcOffset, dst, dstOffset, length) {
        var i = 0;
        src = src.subarray || src.slice ? src : src.buffer;
        dst = dst.subarray || dst.slice ? dst : dst.buffer;
        src = srcOffset ? src.subarray ?
            src.subarray(srcOffset, length && srcOffset + length) :
            src.slice(srcOffset, length && srcOffset + length) : src;
        if (dst.set) {
            dst.set(src, dstOffset);
        }
        else {
            for (i = 0; i < src.length; i++)
                dst[i + dstOffset] = src[i];
        }
        return (dst);
    };
    /**
     * Fast method to advance the line by one position.  The oldest position is removed.
     *
     * @param position {THREE.Vector3}
     */
    MeshLine.prototype.advance = function (position) {
        var positions = this.attributes.position.array;
        var previous = this.attributes.previous.array;
        var next = this.attributes.next.array;
        var l = positions.length;
        // PREVIOUS
        this.memcpy(positions, 0, previous, 0, l);
        // POSITIONS
        this.memcpy(positions, 6, positions, 0, l - 6);
        positions[l - 6] = position.x;
        positions[l - 5] = position.y;
        positions[l - 4] = position.z;
        positions[l - 3] = position.x;
        positions[l - 2] = position.y;
        positions[l - 1] = position.z;
        // NEXT
        this.memcpy(positions, 6, next, 0, l - 6);
        next[l - 6] = position.x;
        next[l - 5] = position.y;
        next[l - 4] = position.z;
        next[l - 3] = position.x;
        next[l - 2] = position.y;
        next[l - 1] = position.z;
        this.attributes.position.needsUpdate = true;
        this.attributes.previous.needsUpdate = true;
        this.attributes.next.needsUpdate = true;
    };
    return MeshLine;
}());
var MeshLineMaterial = /** @class */ (function (_super) {
    __extends(MeshLineMaterial, _super);
    // #endregion
    function MeshLineMaterial(parameters) {
        var _this = this;
        var check = function (v, d) { return v === undefined ? d : v; };
        parameters = parameters || {};
        var lineWidth = check(parameters.lineWidth, 1);
        var map = check(parameters.map, null);
        var useMap = check(parameters.useMap, 0);
        var alphaMap = check(parameters.alphaMap, null);
        var useAlphaMap = check(parameters.useAlphaMap, 0);
        var color = check(parameters.color, new THREE.Color(0xffffff));
        var opacity = check(parameters.opacity, 1);
        var resolution = check(parameters.resolution, new THREE.Vector2(1, 1));
        var sizeAttenuation = check(parameters.sizeAttenuation, 1);
        var near = check(parameters.near, 1);
        var far = check(parameters.far, 1);
        var dashArray = check(parameters.dashArray, 0);
        var dashOffset = check(parameters.dashOffset, 0);
        var dashRatio = check(parameters.dashRatio, 0.5);
        var useDash = (dashArray !== 0) ? 1 : 0;
        var visibility = check(parameters.visibility, 1);
        var alphaTest = check(parameters.alphaTest, 0);
        var repeat = check(parameters.repeat, new THREE.Vector2(1, 1));
        _this = _super.call(this, {
            uniforms: {
                lineWidth: { type: 'f', value: lineWidth },
                map: { type: 't', value: map },
                useMap: { type: 'f', value: useMap },
                alphaMap: { type: 't', value: alphaMap },
                useAlphaMap: { type: 'f', value: useAlphaMap },
                color: { type: 'c', value: color },
                opacity: { type: 'f', value: opacity },
                resolution: { type: 'v2', value: resolution },
                sizeAttenuation: { type: 'f', value: sizeAttenuation },
                near: { type: 'f', value: near },
                far: { type: 'f', value: far },
                dashArray: { type: 'f', value: dashArray },
                dashOffset: { type: 'f', value: dashOffset },
                dashRatio: { type: 'f', value: dashRatio },
                useDash: { type: 'f', value: useDash },
                visibility: { type: 'f', value: visibility },
                alphaTest: { type: 'f', value: alphaTest },
                repeat: { type: 'v2', value: repeat }
            },
            vertexShader: MeshLineMaterial.vertexShaderSource.join('\r\n'),
            fragmentShader: MeshLineMaterial.fragmentShaderSource.join('\r\n'),
            attributes: {
                previous: { type: 'v3', value: new THREE.Vector3() },
                next: { type: 'v3', value: new THREE.Vector3() },
                side: { type: 'f', value: 0 },
                width: { type: 'f', value: 0 },
                uv: { type: 'v2', value: new THREE.Vector2() },
                counters: { type: 'f', value: 0 },
            }
        }) || this;
        delete parameters.lineWidth;
        delete parameters.map;
        delete parameters.useMap;
        delete parameters.alphaMap;
        delete parameters.useAlphaMap;
        delete parameters.color;
        delete parameters.opacity;
        delete parameters.resolution;
        delete parameters.sizeAttenuation;
        delete parameters.near;
        delete parameters.far;
        delete parameters.dashArray;
        delete parameters.dashOffset;
        delete parameters.dashRatio;
        delete parameters.visibility;
        delete parameters.alphaTest;
        delete parameters.repeat;
        _this.type = 'MeshLineMaterial';
        _this.setValues(parameters);
        return _this;
    }
    // #region Shaders
    MeshLineMaterial.vertexShaderSource = [
        'precision highp float;',
        '',
        'attribute vec3 position;',
        'attribute vec3 previous;',
        'attribute vec3 next;',
        'attribute float side;',
        'attribute float width;',
        'attribute vec2 uv;',
        'attribute float counters;',
        '',
        'uniform mat4 projectionMatrix;',
        'uniform mat4 modelViewMatrix;',
        'uniform vec2 resolution;',
        'uniform float lineWidth;',
        'uniform vec3 color;',
        'uniform float opacity;',
        'uniform float near;',
        'uniform float far;',
        'uniform float sizeAttenuation;',
        '',
        'varying vec2 vUV;',
        'varying vec4 vColor;',
        'varying float vCounters;',
        '',
        'vec2 fix( vec4 i, float aspect ) {',
        '',
        '    vec2 res = i.xy / i.w;',
        '    res.x *= aspect;',
        '    vCounters = counters;',
        '    return res;',
        '',
        '}',
        '',
        'void main() {',
        '',
        '    float aspect = resolution.x / resolution.y;',
        '    float pixelWidthRatio = 1. / (resolution.x * projectionMatrix[0][0]);',
        '',
        '    vColor = vec4( color, opacity );',
        '    vUV = uv;',
        '',
        '    mat4 m = projectionMatrix * modelViewMatrix;',
        '    vec4 finalPosition = m * vec4( position, 1.0 );',
        '    vec4 prevPos = m * vec4( previous, 1.0 );',
        '    vec4 nextPos = m * vec4( next, 1.0 );',
        '',
        '    vec2 currentP = fix( finalPosition, aspect );',
        '    vec2 prevP = fix( prevPos, aspect );',
        '    vec2 nextP = fix( nextPos, aspect );',
        '',
        '   float pixelWidth = finalPosition.w * pixelWidthRatio;',
        '    float w = 1.8 * pixelWidth * lineWidth * width;',
        '',
        '    if( sizeAttenuation == 1. ) {',
        '        w = 1.8 * lineWidth * width;',
        '    }',
        '',
        '    vec2 dir;',
        '    if( nextP == currentP ) dir = normalize( currentP - prevP );',
        '    else if( prevP == currentP ) dir = normalize( nextP - currentP );',
        '    else {',
        '        vec2 dir1 = normalize( currentP - prevP );',
        '        vec2 dir2 = normalize( nextP - currentP );',
        '        dir = normalize( dir1 + dir2 );',
        '',
        '        vec2 perp = vec2( -dir1.y, dir1.x );',
        '        vec2 miter = vec2( -dir.y, dir.x );',
        '        //w = clamp( w / dot( miter, perp ), 0., 4. * lineWidth * width );',
        '',
        '    }',
        '',
        '    //vec2 normal = ( cross( vec3( dir, 0. ), vec3( 0., 0., 1. ) ) ).xy;',
        '    vec2 normal = vec2( -dir.y, dir.x );',
        '    normal.x /= aspect;',
        '    normal *= .5 * w;',
        '',
        '    vec4 offset = vec4( normal * side, 0.0, 1.0 );',
        '    finalPosition.xy += offset.xy;',
        '',
        '    gl_Position = finalPosition;',
        '',
        '}'
    ];
    MeshLineMaterial.fragmentShaderSource = [
        // '#extension GL_OES_standard_derivatives : enable',
        'precision mediump float;',
        '',
        'uniform sampler2D map;',
        'uniform sampler2D alphaMap;',
        'uniform float useMap;',
        'uniform float useAlphaMap;',
        'uniform float useDash;',
        'uniform float dashArray;',
        'uniform float dashOffset;',
        'uniform float dashRatio;',
        'uniform float visibility;',
        'uniform float alphaTest;',
        'uniform vec2 repeat;',
        '',
        'varying vec2 vUV;',
        'varying vec4 vColor;',
        'varying float vCounters;',
        '',
        'void main() {',
        '',
        '    vec4 c = vColor;',
        '    if( useMap == 1. ) c *= texture2D( map, vUV * repeat );',
        '    if( useAlphaMap == 1. ) c.a *= texture2D( alphaMap, vUV * repeat ).a;',
        '    if( c.a < alphaTest ) discard;',
        '    if( useDash == 1. ){',
        '        c.a *= ceil(mod(vCounters + dashOffset, dashArray) - (dashArray * dashRatio));',
        '    }',
        '    gl_FragColor = c;',
        '    if( visibility >= 0. ) gl_FragColor.a *= step(vCounters, visibility);',
        '    if( visibility < 0. ) gl_FragColor.a *= step(1. + visibility, vCounters);',
        '}'
    ];
    return MeshLineMaterial;
}(THREE.RawShaderMaterial));
//# sourceMappingURL=THREE.MeshLine.r71.js.map