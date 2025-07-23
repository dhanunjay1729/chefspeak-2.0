type ProcessorPolyfill = {
    port?: {
        onmessage?: (event: MessageEvent<{
            buffer: Float32Array[];
        }>) => void;
    };
};
//# sourceMappingURL=audioworklet_polyfill.d.ts.map