"use strict";
class InMemoryFilterModel {
    constructor() {
        this.data = {};
    }
    queryHandlers(filter) {
        return new Promise(resolve => {
            if (typeof (this.data[filter.baseKey]) == 'undefined')
                return resolve([]);
            const handlers = Object.keys(this.data[filter.baseKey]).map(handlerKey => this.data[filter.baseKey][handlerKey]);
            handlers.sort((a, b) => a.priority - b.priority);
            return resolve(handlers.map(w => w.handler));
        });
    }
    registerHandler(obj) {
        const { filter, handler } = obj;
        return new Promise(resolve => {
            if (typeof (this.data[filter.baseKey]) === 'undefined') {
                this.data[filter.baseKey] = {};
            }
            this.data[filter.baseKey][handler.key] = {
                priority: obj.priority || 10,
                handler: handler
            };
            return resolve();
        });
    }
}
exports.InMemoryFilterModel = InMemoryFilterModel;
//# sourceMappingURL=inmemoryfiltermodel.class.js.map