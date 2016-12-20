"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const worker_1 = require("../src/worker");
const chai_1 = require("chai");
const inmemoryfiltermodel_class_1 = require("../src/filtermodel/inmemoryfiltermodel.class");
const base_class_1 = require("../src/handler/base.class");
const sinon_1 = require("sinon");
describe('FilterTest', () => {
    describe('addHandler', () => {
        it('should call model addHandler method', () => __awaiter(this, void 0, void 0, function* () {
            let inMemoryFilterModel = new inmemoryfiltermodel_class_1.InMemoryFilterModel();
            let filter = new worker_1.Filter("adder", inMemoryFilterModel);
            const theSpy = sinon_1.spy(inMemoryFilterModel, 'registerHandler');
            let handler = base_class_1.Handler.fromCback('haha', () => {
            });
            yield filter.addHandler({ handler });
            chai_1.expect(theSpy.called).is.true;
            chai_1.expect(theSpy.callCount).is.eq(1);
            chai_1.expect(theSpy.args[0][0].filter).is.eq(filter);
            chai_1.expect(theSpy.args[0][0].handler).is.eq(handler);
        }));
    });
    describe('process', () => {
        let filter;
        beforeEach(() => {
            filter = new worker_1.Filter("adder", new inmemoryfiltermodel_class_1.InMemoryFilterModel());
        });
        it('shouldnt do anything and return original value if no handlers', () => __awaiter(this, void 0, void 0, function* () {
            let res = yield filter.process(1);
            chai_1.expect(res).is.eq(1);
        }));
        it('should call handler and return manipulated value', () => __awaiter(this, void 0, void 0, function* () {
            yield filter.addHandler({ handler: base_class_1.Handler.fromCback('handler', (o, cback) => cback(null, o + 1)) });
            chai_1.expect(yield filter.process(1)).is.eq(2);
        }));
        it('should call handlers in order', () => __awaiter(this, void 0, void 0, function* () {
            yield filter.addHandler({ priority: 11, handler: base_class_1.Handler.fromCback('handler', (o, cback) => cback(null, o / 2)) });
            yield filter.addHandler({ priority: 10, handler: base_class_1.Handler.fromCback('handler1', (o, cback) => cback(null, o + 1)) });
            chai_1.expect(yield filter.process(2)).is.eq(1.5);
        }));
    });
    describe('processParallel', () => {
        let filter;
        beforeEach(() => {
            filter = new worker_1.Filter("adder", new inmemoryfiltermodel_class_1.InMemoryFilterModel());
        });
        it('shouldnt do anything and return empty array if no handlers', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield filter.processParallel(1)).is.deep.eq([]);
        }));
        it('should call all handlers and return arr of all mapped results in order', () => __awaiter(this, void 0, void 0, function* () {
            yield filter.addHandler({ priority: 11, handler: base_class_1.Handler.fromCback('handler', (o, cback) => cback(null, o / 2)) });
            yield filter.addHandler({ priority: 10, handler: base_class_1.Handler.fromCback('handler1', (o, cback) => cback(null, o + 1)) });
            chai_1.expect(yield filter.processParallel(2)).is.deep.eq([
                2 + 1,
                2 / 2
            ]);
        }));
    });
    describe('unregister', () => {
    });
});
//# sourceMappingURL=filtertest.test.js.map