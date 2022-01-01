import * as Consul from 'consul';
export declare class Watcher {
    private readonly consul;
    private readonly options;
    private watcher;
    private callback;
    private lastChangeTime;
    constructor(consul: Consul, options: {
        retry?: number;
        method: any;
        params?: object;
    });
    getLastChangeTime(): number;
    watch(callback: (e: any, nodes: any) => void): void;
    end(): void;
    clear(): void;
}
