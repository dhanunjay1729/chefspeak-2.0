export default class ResamplerWorker {
    private readonly _worker;
    private readonly _version;
    private static _wasm;
    private constructor();
    static setWasm(wasm: string): void;
    static create(inputSampleRate: number, outputSampleRate: number, filterOrder: number, frameLength: number, resampleCallback: (inputFrame: Int16Array) => void): Promise<ResamplerWorker>;
    process(inputFrame: Int16Array | Float32Array): void;
    reset(): Promise<void>;
    release(): Promise<void>;
    terminate(): void;
    getNumRequiredInputSamples(numSample: number): Promise<number>;
}
//# sourceMappingURL=resampler_worker.d.ts.map