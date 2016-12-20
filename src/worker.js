"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
class Filter {
    constructor(baseKey, model) {
        this.baseKey = baseKey;
        this.model = model;
    }
    addHandler(obj) {
        return this.model.registerHandler({
            filter: this,
            handler: obj.handler,
            priority: obj.priority,
        });
    }
    process(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryHandlers = yield this.model.queryHandlers(this);
            let toRet = obj;
            for (let i = 0; i < queryHandlers.length; i++) {
                let h = queryHandlers[i];
                toRet = yield h.handle(toRet);
            }
            return toRet;
        });
    }
    processParallel(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryHandlers = yield this.model.queryHandlers(this);
            return Promise.all(queryHandlers.map(h => h.handle(obj)));
        });
    }
}
exports.Filter = Filter;
//# sourceMappingURL=worker.js.map