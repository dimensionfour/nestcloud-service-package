"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsulStore = void 0;
const lodash_1 = require("lodash");
const common_1 = require("@nestcloud/common");
const service_util_1 = require("./utils/service.util");
const consul_service_watcher_1 = require("./consul-service-watcher");
const array_util_1 = require("./utils/array.util");
class ConsulStore {
    constructor(consul, includes) {
        this.consul = consul;
        this.includes = includes;
        this.watcher = null;
        this.watchers = {};
        this.WATCH_TIMEOUT = 305000;
        this.services = {};
        this.serviceCallbackMaps = new Map();
        this.servicesCallbacks = [];
    }
    async init() {
        let services = await this.consul.catalog.service.list();
        if (!this.includes || this.includes.length === 0) {
            services = array_util_1.toList(services);
        }
        else {
            services = lodash_1.intersection(array_util_1.toList(services), this.includes);
        }
        services = services.filter(service => service !== 'consul');
        await this.initServices(services);
        this.createServicesWatcher();
    }
    watch(service, callback) {
        const callbacks = this.serviceCallbackMaps.get(service);
        if (!callbacks) {
            this.serviceCallbackMaps.set(service, [callback]);
        }
        else {
            callbacks.push(callback);
            this.serviceCallbackMaps.set(service, callbacks);
        }
    }
    watchServiceList(callback) {
        this.servicesCallbacks.push(callback);
    }
    getServices() {
        return this.services;
    }
    getServiceNames() {
        const services = [];
        for (const key in this.services) {
            if (this.services.hasOwnProperty(key)) {
                services.push(key);
            }
        }
        return services;
    }
    getServiceNodes(service, passing) {
        const nodes = this.services[service] || [];
        if (passing) {
            return nodes.filter(node => node.status === common_1.PASSING);
        }
        return nodes;
    }
    setNodes(service, nodes) {
        this.services[service] = nodes;
        if (this.serviceCallbackMaps.has(service)) {
            const callbacks = this.serviceCallbackMaps.get(service);
            callbacks.forEach(cb => cb(nodes));
        }
    }
    async initServices(services) {
        // init watchers
        array_util_1.toValueList(this.watchers).forEach(watcher => watcher.clear());
        this.watchers = [];
        await Promise.all(services.map(async (service) => {
            const nodes = await this.consul.health.service(service);
            const serviceNodes = service_util_1.handleConsulNodes(nodes);
            this.setNodes(service, serviceNodes);
            this.createServiceNodesWatcher(service);
        }));
    }
    createServiceNodesWatcher(service) {
        if (this.watchers[service]) {
            this.watchers[service].clear();
        }
        const watcher = (this.watchers[service] = new consul_service_watcher_1.Watcher(this.consul, {
            method: this.consul.health.service,
            params: { service, wait: '5m', timeout: this.WATCH_TIMEOUT },
        }));
        watcher.watch((e, nodes) => {
            if (!e) {
                const serviceNodes = service_util_1.handleConsulNodes(nodes);
                this.setNodes(service, serviceNodes);
            }
        });
    }
    createServicesWatcher() {
        if (this.watcher) {
            this.watcher.clear();
        }
        const watcher = (this.watcher = new consul_service_watcher_1.Watcher(this.consul, {
            method: this.consul.catalog.service.list,
            params: { wait: '5m', timeout: this.WATCH_TIMEOUT },
        }));
        watcher.watch(async (e, services) => {
            if (!e) {
                if (!this.includes || this.includes.length === 0) {
                    services = array_util_1.toList(services);
                }
                else {
                    services = lodash_1.intersection(array_util_1.toList(services), this.includes);
                }
                services = services.filter(service => service !== 'consul');
                await this.initServices(services);
                this.servicesCallbacks.forEach(cb => cb(services));
            }
        });
    }
}
exports.ConsulStore = ConsulStore;
