"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestcloud/common");
exports.InjectService = () => common_1.Inject(common_2.NEST_SERVICE_PROVIDER);
