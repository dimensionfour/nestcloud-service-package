import * as Consul from 'consul';
import { IServiceNode } from '@nestcloud/common';
export declare class ConsulStore {
    private readonly consul;
    private readonly includes?;
    private watcher;
    private watchers;
    private readonly WATCH_TIMEOUT;
    private readonly services;
    private readonly serviceCallbackMaps;
    private readonly servicesCallbacks;
    constructor(consul: Consul, includes?: string[]);
    init(): Promise<void>;
    watch(service: string, callback: (nodes: IServiceNode[]) => void): void;
    watchServiceList(callback: (services: string[]) => void): void;
    getServices(): {
        [service: string]: IServiceNode[];
    };
    getServiceNames(): string[];
    getServiceNodes(service: string, passing?: boolean): IServiceNode[];
    private setNodes;
    private initServices;
    private createServiceNodesWatcher;
    private createServicesWatcher;
}
