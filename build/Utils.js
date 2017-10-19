"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isRepeat = isRepeat;
function isRepeat(list, item, key) {
    for (let i = 0; i < list.length; i++) {
        const obj = list[i];

        if (!key) {
            if (obj == item) {
                return true;
            }
        } else {
            if (obj[key] == item) {
                return true;
            }
        }
    }

    return false;
}