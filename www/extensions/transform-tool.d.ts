/// <reference types="forge-viewer" />
declare class TransformTool {
    private viewer;
    private options;
    private _hitPoint;
    private _isDragging;
    private _transformMesh;
    private _modifiedFragIdMap;
    private _selectedFragProxyMap;
    private _transformControlTx;
    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options?: any);
    getNames(): string[];
    getName(): string;
    activate(): void;
    deactivate(): void;
    protected update(t: any): boolean;
    protected onItemSelected(event: any): void;
    protected onTxChange(): void;
    protected onCameraChanged(): void;
    protected handleSingleClick(event: any, button: any): boolean;
    protected handleDoubleClick(event: any, button: any): boolean;
    protected handleSingleTap(event: any): boolean;
    protected handleDoubleTap(event: any): boolean;
    protected handleKeyDown(event: any, keyCode: any): boolean;
    protected handleKeyUp(event: any, keyCode: any): boolean;
    protected handleWheelInput(delta: number): boolean;
    protected handleButtonDown(event: any, button: any): boolean;
    protected handleButtonUp(event: any, button: any): boolean;
    protected handleMouseMove(event: any): boolean;
    protected handleGesture(event: any): boolean;
    protected handleBlur(event: any): boolean;
    protected handleResize(): boolean;
    protected getHitPoint(event: any): THREE.Vector3;
    protected normalize(screenPoint: THREE.Vector2): THREE.Vector2;
    protected getTransformMap(): void;
    static guid(): string;
    protected createTransformMesh(): THREE.Mesh;
}
declare class TransformExtension extends Autodesk.Viewing.Extension {
    private tool;
    private toolactivated;
    private _group;
    private _button;
    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options?: any);
    load(): boolean;
    unload(): boolean;
    protected initialize(): void;
    protected customize(): void;
    onToolbarCreated(): void;
}
