"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConsulNodes = void 0;
const service_node_1 = require("../service-node");
const common_1 = require("@nestcloud/common");
const lodash_1 = require("lodash");
function handleConsulNodes(nodes) {
    return nodes.map(node => {
        let status = common_1.CRITICAL;
        if (node.Checks.length) {
            status = common_1.PASSING;
        }
        for (let i = 0; i < node.Checks.length; i++) {
            const check = node.Checks[i];
            if (check.Status === common_1.CRITICAL) {
                status = common_1.CRITICAL;
                break;
            }
            else if (check.Status === common_1.WARNING) {
                status = common_1.WARNING;
                break;
            }
        }
        return Object.assign(Object.assign({}, node), { status });
    }).map(node => {
        const serviceNode = new service_node_1.ServiceNode(lodash_1.get(node, 'Service.Address', '127.0.0.1'), lodash_1.get(node, 'Service.Port'));
        serviceNode.name = lodash_1.get(node, 'Node.Node');
        serviceNode.tags = lodash_1.get(node, 'Service.Tags', []);
        serviceNode.service = lodash_1.get(node, 'Service.Service');
        serviceNode.status = lodash_1.get(node, 'status', common_1.CRITICAL);
        return serviceNode;
    });
}
exports.handleConsulNodes = handleConsulNodes;
