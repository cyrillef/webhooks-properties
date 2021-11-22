/// <reference types="forge-viewer" />
declare class MeshLine {
    previous: any[];
    next: any[];
    side: any[];
    width: any[];
    counters: any[];
    geometry: THREE.BufferGeometry;
    private positions;
    private indicesArray;
    private uvs;
    private widthCallback;
    private attributes;
    constructor();
    setGeometry(g: number[] | Float32Array | THREE.Geometry | THREE.BufferGeometry, c?: any): void;
    compareV3(a: number, b: number): boolean;
    copyV3(a: number): number[];
    process(): void;
    memcpy(src: any, srcOffset: number, dst: any, dstOffset: number, length: number): Uint16Array | Float32Array;
    /**
     * Fast method to advance the line by one position.  The oldest position is removed.
     *
     * @param position {THREE.Vector3}
     */
    advance(position: THREE.Vector3): void;
}
declare class MeshLineMaterial extends THREE.RawShaderMaterial {
    private static vertexShaderSource;
    private static fragmentShaderSource;
    constructor(parameters: any);
}
