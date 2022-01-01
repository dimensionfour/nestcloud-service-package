"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsulService = void 0;
const common_1 = require("@nestjs/common");
const md5encode = require("blueimp-md5");
const lodash_1 = require("lodash");
const common_2 = require("@nestcloud/common");
const os_util_1 = require("./utils/os.util");
const consul_store_1 = require("./consul-store");
class ConsulService {
    constructor(consul, options) {
        this.consul = consul;
        this.logger = new common_1.Logger('ServiceModule');
        this.discoveryHost = lodash_1.get(options, 'discoveryHost', os_util_1.getIPAddress());
        this.serviceId = lodash_1.get(options, 'id');
        this.serviceName = lodash_1.get(options, 'name');
        // tslint:disable-next-line:no-bitwise
        this.servicePort = lodash_1.get(options, 'port', 40000 + ~~(Math.random() * (40000 - 30000)));
        this.serviceTags = lodash_1.get(options, 'tags');
        this.connect = lodash_1.get(options, 'connect', {});
        this.healthCheck = lodash_1.get(options, 'healthCheck');
        this.timeout = lodash_1.get(options, 'healthCheck.timeout', '1s');
        this.interval = lodash_1.get(options, 'healthCheck.interval', '10s');
        this.deregisterCriticalServiceAfter = lodash_1.get(options, 'healthCheck.deregisterCriticalServiceAfter');
        this.maxRetry = lodash_1.get(options, 'maxRetry', 5);
        this.retryInterval = lodash_1.get(options, 'retryInterval', 5000);
        this.protocol = lodash_1.get(options, 'healthCheck.protocol', 'http');
        this.route = lodash_1.get(options, 'healthCheck.route', '/health');
        this.tcp = lodash_1.get(options, 'healthCheck.tcp');
        this.script = lodash_1.get(options, 'healthCheck.script');
        this.dockerContainerId = lodash_1.get(options, 'healthCheck.dockerContainerId');
        this.shell = lodash_1.get(options, 'healthCheck.shell');
        this.ttl = lodash_1.get(options, 'healthCheck.ttl');
        this.notes = lodash_1.get(options, 'healthCheck.notes');
        this.status = lodash_1.get(options, 'healthCheck.status');
        this.includes = lodash_1.get(options, 'service.includes', []);
    }
    async init() {
        this.store = new consul_store_1.ConsulStore(this.consul, this.includes);
        while (true) {
            try {
                await this.store.init();
                this.logger.log('ServiceModule initialized');
                break;
            }
            catch (e) {
                this.logger.error(`Unable to initial ServiceModule, retrying...`, e);
                await common_2.sleep(this.retryInterval);
            }
        }
    }
    watch(service, callback) {
        this.store.watch(service, callback);
    }
    watchServiceList(callback) {
        this.store.watchServiceList(callback);
    }
    getServices() {
        return this.store.getServices();
    }
    getServiceNames() {
        return this.store.getServiceNames();
    }
    getServiceNodes(service, passing) {
        return this.store.getServiceNodes(service, passing);
    }
    async onModuleInit() {
        await this.registerService();
    }
    async onModuleDestroy() {
        await this.cancelService();
    }
    generateService() {
        var _a, _b;
        const check = {
            interval: this.interval,
            timeout: this.timeout,
            deregistercriticalserviceafter: this.deregisterCriticalServiceAfter,
            notes: this.notes,
            status: this.status,
        };
        if (this.tcp) {
            check.tcp = this.tcp;
        }
        else if (this.script) {
            check.script = this.script;
        }
        else if (this.dockerContainerId) {
            check.dockercontainerid = this.dockerContainerId;
            check.shell = this.shell;
        }
        else if (this.ttl) {
            check.ttl = this.ttl;
        }
        else {
            check.http = (_b = (_a = this.healthCheck) === null || _a === void 0 ? void 0 : _a.http) !== null && _b !== void 0 ? _b : `${this.protocol}://${this.discoveryHost}:${this.servicePort}${this.route}`;
        }
        return {
            id: this.serviceId || md5encode(`${this.discoveryHost}:${this.servicePort}`),
            name: this.serviceName,
            address: this.discoveryHost,
            port: parseInt(this.servicePort + ''),
            tags: this.serviceTags,
            connect: this.connect,
            check: this.healthCheck ? check : undefined,
        };
    }
    async registerService() {
        const service = this.generateService();
        while (true) {
            try {
                await this.consul.agent.service.register(service);
                this.logger.log(`Register service ${service.name} success.`);
                break;
            }
            catch (e) {
                this.logger.warn(`Register service ${service.name} fail, retrying...`, e);
                await common_2.sleep(this.retryInterval);
            }
        }
    }
    async cancelService() {
        const service = this.generateService();
        let current = 0;
        while (true) {
            try {
                await this.consul.agent.service.deregister(service);
                this.logger.log(`Deregister service ${service.name} success.`);
                break;
            }
            catch (e) {
                if (this.maxRetry !== -1 && ++current > this.maxRetry) {
                    this.logger.error(`Deregister service ${service.name} fail`, e);
                    break;
                }
                this.logger.warn(`Deregister service ${service.name} fail, retrying...`, e);
                await common_2.sleep(this.retryInterval);
            }
        }
    }
}
exports.ConsulService = ConsulService;
