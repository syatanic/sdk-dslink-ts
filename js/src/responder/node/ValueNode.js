"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_local_node_1 = require("../base_local_node");
const permission_1 = require("../../common/permission");
/**
 * base class for a serializable value node
 */
class ValueNode extends base_local_node_1.BaseLocalNode {
    constructor(path, provider, profileName = 'node', type = 'dynamic', writable = permission_1.Permission.NEVER, saveValue = false) {
        super(path, provider, profileName);
        this._valueReady = true;
        this.setConfig('$type', type);
        this._saveValue = saveValue;
        if (writable < permission_1.Permission.NEVER) {
            this.setConfig('$writable', permission_1.Permission.names[writable]);
        }
    }
    save() {
        let data = super.save();
        if (this._saveValue) {
            data['?value'] = this._value;
        }
        return data;
    }
    load(data) {
        super.load(data);
        if (this._saveValue && data.hasOwnProperty('?value')) {
            this._value = data['?value'];
        }
    }
    changeValue(newValue) {
        let changed = super.changeValue((newValue));
        if (changed && this._saveValue) {
            this.provider.save();
        }
        return changed;
    }
}
exports.ValueNode = ValueNode;
//# sourceMappingURL=ValueNode.js.map