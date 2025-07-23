declare class Resampler {
    private readonly _pvResamplerConvertNumSamplesToInputSampleRate;
    private readonly _pvResamplerConvertNumSamplesToOutputSampleRate;
    private readonly _pvResamplerDelete;
    private readonly _pvResamplerProcess;
    private readonly _pvResamplerReset;
    private readonly _cAlignedAlloc;
    private readonly _inputBufferAddress;
    private readonly _objectAddress;
    private readonly _outputBufferAddress;
    private _wasmMemory;
    private readonly _frameLength;
    private readonly _inputBufferLength;
    private static _wasm;
    static _version: string;
    private constructor();
    static setWasm(wasm: string): void;
    static create(inputFrequency: number, outputFrequency: number, order: number, frameLength: number): Promise<Resampler>;
    private static initWasm;
    process(inputFrame: Int16Array | Float32Array, outputBuffer: Int16Array): number;
    reset(): void;
    release(): void;
    get inputBufferLength(): number;
    get frameLength(): number;
    get version(): string;
    getNumRequiredInputSamples(numSample: number): number;
    getNumRequiredOutputSamples(numSample: number): number;
}
export default Resampler;
//# sourceMappingURL=resampler.d.ts.map