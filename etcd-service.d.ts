import { IService, IServiceNode, IEtcd } from '@nestcloud/common';
import { IServiceOptions } from './interfaces/service-options.interface';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class EtcdService implements IService, OnModuleInit, OnModuleDestroy {
    private readonly client;
    private readonly options;
    private readonly namespace;
    private readonly logger;
    private services;
    private readonly self;
    private readonly serviceCallbackMaps;
    private readonly servicesCallbacks;
    private watcher;
    private timer;
    constructor(client: IEtcd, options: IServiceOptions);
    init(): Promise<this>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getServiceNames(): string[];
    getServiceNodes(service: string, passing?: boolean): IServiceNode[];
    getServices(): {
        [p: string]: IServiceNode[];
    };
    watch(service: string, callback: (services: IServiceNode[]) => void): void;
    watchServiceList(callback: (service: string[]) => void): void;
    private registerService;
    private cancelService;
    private initServices;
    private recreateServiceWatcher;
    private initServicesWatcher;
}
