import { PvEngine, WebVoiceProcessorOptions } from './types';
/**
 * WebVoiceProcessor Error Class
 */
export declare class WvpError extends Error {
    constructor(name: string, message: string);
}
/**
 * Obtain microphone permission and audio stream;
 * Down sample audio into 16kHz single-channel PCM for speech recognition (via ResamplerWorker).
 * Continuously send audio frames to voice processing engines.
 */
export declare class WebVoiceProcessor {
    private _mutex;
    private _audioContext;
    private _microphoneStream;
    private _recorderNode;
    private _resamplerWorker;
    private readonly _engines;
    private _options;
    private _state;
    private static _instance;
    private constructor();
    /**
     * Gets the WebVoiceProcessor singleton instance.
     *
     * @return WebVoiceProcessor singleton.
     */
    private static instance;
    /**
     * Record some sample raw signed 16-bit PCM data for some duration, then pack it as a Blob.
     *
     * @param durationMs the duration of the recording, in milliseconds
     * @return the data in Blob format, wrapped in a promise
     */
    static audioDump(durationMs?: number): Promise<Blob>;
    /**
     * Subscribe an engine. A subscribed engine will receive audio frames via
     * `.postMessage({command: 'process', inputFrame: inputFrame})`.
     * @param engines The engine(s) to subscribe.
     */
    static subscribe(engines: PvEngine | PvEngine[]): Promise<void>;
    /**
     * Unsubscribe an engine.
     * @param engines The engine(s) to unsubscribe.
     */
    static unsubscribe(engines: PvEngine | PvEngine[]): Promise<void>;
    /**
     * Removes all engines and stops recording audio.
     */
    static reset(): Promise<void>;
    /**
     * Set new WebVoiceProcessor options.
     * If forceUpdate is not set to true, all engines must be unsubscribed and subscribed
     * again in order for the recorder to take the new changes.
     * Using forceUpdate might allow a small gap where audio frames is not received.
     *
     * @param options WebVoiceProcessor recording options.
     * @param forceUpdate Flag to force update recorder with new options.
     */
    static setOptions(options: WebVoiceProcessorOptions, forceUpdate?: boolean): void;
    /**
     * Gets the current audio context.
     */
    static get audioContext(): AudioContext | null;
    /**
     * Flag to check if it is currently recording.
     */
    static get isRecording(): boolean;
    /**
     * Resumes or starts audio context. Also initializes resampler, capture device and other configurations
     * based on `options`.
     */
    private start;
    /**
     * Stops and closes resources used. Furthermore, terminates and stops any other
     * instance created initially.
     * AudioContext is kept alive to be used when starting again.
     */
    private stop;
    /**
     * Flag to check if audio context has been suspended.
     */
    private get isSuspended();
    /**
     * Flag to check if audio context has been released.
     */
    private get isReleased();
    private recorderCallback;
    private getAudioContext;
    private setupRecorder;
}
//# sourceMappingURL=web_voice_processor.d.ts.map