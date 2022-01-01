"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceNode = void 0;
class ServiceNode {
    constructor(address, port) {
        this.address = address;
        this.port = port;
        this.id = `${address}:${port}`;
        this.zone = 'default';
        this.name = this.id;
    }
}
exports.ServiceNode = ServiceNode;
