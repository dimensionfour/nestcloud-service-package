"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtcdService = void 0;
const lodash_1 = require("lodash");
const common_1 = require("@nestcloud/common");
const common_2 = require("@nestjs/common");
const YAML = require("yamljs");
const service_node_1 = require("./service-node");
const os_util_1 = require("./utils/os.util");
class EtcdService {
    constructor(client, options) {
        this.client = client;
        this.options = options;
        // nestcloud-service/service__${serviceName}__${ip}__${port}
        this.namespace = 'nestcloud-service/';
        this.logger = new common_2.Logger(EtcdService.name);
        this.services = {};
        this.serviceCallbackMaps = new Map();
        this.servicesCallbacks = [];
        const address = this.options.discoveryHost || os_util_1.getIPAddress();
        const port = this.options.port;
        const serviceNode = new service_node_1.ServiceNode(address, port + '');
        serviceNode.tags = this.options.tags || [];
        if (this.options.name) {
            serviceNode.name = this.options.name;
        }
        this.self = serviceNode;
    }
    async init() {
        await this.registerService();
        return this;
    }
    async onModuleInit() {
        await this.initServices();
        await this.initServicesWatcher();
    }
    async onModuleDestroy() {
        await this.cancelService();
    }
    getServiceNames() {
        const names = [];
        for (const key in this.services) {
            if (this.services.hasOwnProperty(key)) {
                names.push(key);
            }
        }
        return names;
    }
    getServiceNodes(service, passing) {
        return this.services[service];
    }
    getServices() {
        return this.services;
    }
    watch(service, callback) {
        const callbacks = this.serviceCallbackMaps.get(service) || [];
        callbacks.push(callback);
        this.serviceCallbackMaps.set(service, callbacks);
    }
    watchServiceList(callback) {
        this.servicesCallbacks.push(callback);
    }
    async registerService() {
        const key = `service__${this.self.name}__${this.self.address}__${this.self.port}`;
        const ttl = lodash_1.get(this.options, 'healthCheck.ttl', 20);
        while (true) {
            try {
                const lease = this.client.namespace(this.namespace).lease(ttl);
                await lease.put(key).value(YAML.stringify(this.self));
                lease.on('lost', async () => {
                    lease.removeAllListeners('lost');
                    await common_1.sleep(5000);
                    await this.registerService();
                });
                this.logger.log('ServiceModule initialized');
                break;
            }
            catch (e) {
                this.logger.error(`Unable to initial ServiceModule, retrying...`, e);
                await common_1.sleep(this.options.retryInterval || 5000);
            }
        }
    }
    async cancelService() {
        const key = `service__${this.self.name}__${this.self.address}__${this.self.port}`;
        const maxRetry = this.options.maxRetry || 5;
        const retryInterval = this.options.retryInterval || 5000;
        let current = 0;
        while (true) {
            try {
                await this.client.namespace(this.namespace).delete().key(key);
                this.logger.log(`Deregister service ${this.self.name} success.`);
                break;
            }
            catch (e) {
                if (maxRetry !== -1 && ++current > maxRetry) {
                    this.logger.error(`Deregister service ${this.self.name} fail`, e);
                    break;
                }
                this.logger.warn(`Deregister service ${this.self.name} fail, retrying...`, e);
                await common_1.sleep(retryInterval);
            }
        }
    }
    async initServices() {
        const services = await this.client.namespace(this.namespace).getAll().buffers();
        for (const key in services) {
            if (services.hasOwnProperty(key)) {
                const chunks = key.split('__');
                if (chunks.length === 4 && chunks[0] === 'service') {
                    const serviceName = chunks[1];
                    const address = chunks[2];
                    const port = chunks[3];
                    this.services[serviceName] = this.services[serviceName] || [];
                    this.services[serviceName] = this.services[serviceName].filter(item => {
                        return item.address !== address || item.port !== port;
                    });
                    try {
                        this.services[serviceName].push(YAML.parse(services[key].toString()));
                    }
                    catch (e) {
                        this.logger.error(`parse service ${key} error.`, e);
                    }
                    this.servicesCallbacks.forEach(cb => cb(this.getServiceNames()));
                    const callbacks = this.serviceCallbackMaps.get(serviceName);
                    if (callbacks && callbacks.length) {
                        callbacks.forEach(cb => cb(this.services[serviceName]));
                    }
                }
            }
        }
    }
    recreateServiceWatcher(immediate) {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(async () => {
            if (this.watcher) {
                try {
                    await this.watcher.cancel();
                    this.watcher = null;
                }
                catch (e) {
                    this.recreateServiceWatcher();
                    this.logger.warn(`Cancel the service watcher fail`);
                }
                try {
                    await this.initServicesWatcher();
                }
                catch (e) {
                    this.recreateServiceWatcher();
                    this.logger.error('Service watcher created error.', e);
                }
                this.logger.log('Service watcher recreate succeed.');
            }
        }, immediate ? 0 : 60000);
    }
    async initServicesWatcher() {
        this.watcher = await this.client.namespace(this.namespace).watch().prefix('').create();
        this.watcher.on('connected', () => {
            this.logger.log('Service watcher connected');
        });
        this.watcher.on('disconnected', () => {
            this.logger.log('Service watcher disconnected');
        });
        this.watcher.on('connecting', () => {
            this.logger.log('Service watcher connecting...');
        });
        this.watcher.on('end', async () => {
            this.logger.error('Service watcher unexpected end and will recreate soon');
            this.recreateServiceWatcher(true);
        });
        this.watcher.on('error', async (e) => {
            this.logger.error('Service watcher occur unexpected error and will recreate soon', e.stack);
            this.recreateServiceWatcher(true);
        });
        this.watcher.on('data', (res) => {
            res.events.forEach(evt => {
                const key = evt.kv.key.toString();
                const chunks = key.split('__');
                if (chunks.length === 4 && chunks[0] === 'service') {
                    const serviceName = chunks[1];
                    const address = chunks[2];
                    const port = chunks[3];
                    this.services[serviceName] = this.services[serviceName] || [];
                    this.services[serviceName] = this.services[serviceName].filter(item => {
                        return item.address !== address || item.port !== port;
                    });
                    try {
                        if (evt.type === 'Put') {
                            this.services[serviceName].push(YAML.parse(evt.kv.value.toString()));
                        }
                        else if (evt.type === 'Delete') {
                            const etcdKey = evt.kv.key.toString();
                            this.services[serviceName] = this.services[serviceName].filter(item => {
                                const key = `service__${item.name}__${item.address}__${item.port}`;
                                return etcdKey !== key;
                            });
                        }
                    }
                    catch (e) {
                        this.logger.error(`parse service ${key} error.`, e);
                    }
                    this.servicesCallbacks.forEach(cb => cb(this.getServiceNames()));
                    const callbacks = this.serviceCallbackMaps.get(serviceName);
                    if (callbacks && callbacks.length) {
                        callbacks.forEach(cb => cb(this.services[serviceName]));
                    }
                }
            });
        });
    }
}
exports.EtcdService = EtcdService;
