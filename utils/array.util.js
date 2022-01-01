"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toValueList = exports.toList = void 0;
function toList(object) {
    const result = [];
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            result.push(key);
        }
    }
    return result;
}
exports.toList = toList;
function toValueList(object) {
    const result = [];
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            result.push(object[key]);
        }
    }
    return result;
}
exports.toValueList = toValueList;
