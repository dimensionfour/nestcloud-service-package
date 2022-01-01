import { IServiceNode } from '@nestcloud/common';
export declare class ServiceNode implements IServiceNode {
    id: string;
    service: string;
    name: string;
    address: string;
    port: string;
    zone?: string;
    status: string;
    tags?: string[];
    constructor(address: string, port: string);
}
