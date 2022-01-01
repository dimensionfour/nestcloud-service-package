"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ServiceModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceModule = void 0;
const common_1 = require("@nestjs/common");
const consul_service_1 = require("./consul-service");
const common_2 = require("@nestcloud/common");
const etcd_service_1 = require("./etcd-service");
let ServiceModule = ServiceModule_1 = class ServiceModule {
    static register(options = {}) {
        const inject = [];
        if (options.dependencies) {
            if (options.dependencies.includes(common_2.NEST_BOOT)) {
                inject.push(common_2.NEST_BOOT_PROVIDER);
            }
            if (options.dependencies.includes(common_2.NEST_CONSUL)) {
                inject.push(common_2.NEST_CONSUL_PROVIDER);
            }
            if (options.dependencies.includes(common_2.NEST_ETCD)) {
                inject.push(common_2.NEST_ETCD_PROVIDER);
            }
        }
        const consulServiceProvider = {
            provide: common_2.NEST_SERVICE_PROVIDER,
            useFactory: async (...args) => {
                const boot = args[inject.indexOf(common_2.NEST_BOOT_PROVIDER)];
                const consul = args[inject.indexOf(common_2.NEST_CONSUL_PROVIDER)];
                const etcd = args[inject.indexOf(common_2.NEST_ETCD_PROVIDER)];
                if (boot) {
                    options = boot.get('service', {});
                }
                let service;
                if (consul) {
                    service = new consul_service_1.ConsulService(consul, options);
                }
                else if (etcd) {
                    service = new etcd_service_1.EtcdService(etcd, options);
                }
                else {
                    throw new Error('Please specific NEST_CONSUL or NEST_ETCD in dependencies attribute');
                }
                await service.init();
                return service;
            },
            inject,
        };
        return {
            module: ServiceModule_1,
            providers: [consulServiceProvider],
            exports: [consulServiceProvider],
        };
    }
};
ServiceModule = ServiceModule_1 = __decorate([
    common_1.Global(),
    common_1.Module({})
], ServiceModule);
exports.ServiceModule = ServiceModule;
