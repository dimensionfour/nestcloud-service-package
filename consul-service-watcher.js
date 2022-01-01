"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watcher = void 0;
class Watcher {
    constructor(consul, options) {
        this.consul = consul;
        this.options = options;
    }
    getLastChangeTime() {
        return this.lastChangeTime;
    }
    watch(callback) {
        if (this.watcher)
            this.watcher.end();
        this.callback = callback;
        this.watcher = this.consul.watch({
            method: this.options.method,
            options: this.options.params,
        });
        this.watcher.on('change', data => {
            callback(null, data);
            this.lastChangeTime = new Date().getTime();
        });
        this.watcher.on('error', e => {
            callback(e, null);
        });
    }
    end() {
        if (this.watcher) {
            this.watcher.end();
        }
    }
    clear() {
        this.end();
        this.watcher = null;
    }
}
exports.Watcher = Watcher;
