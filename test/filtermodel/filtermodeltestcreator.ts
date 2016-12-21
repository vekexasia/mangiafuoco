import { FilterModel, HandlerRegistration } from '../../src/filtermodel/filter.model.interface';
import { BaseHookSystem } from '../../src/hooksystems/BaseHookSystem.class';
import { expect } from 'chai';
import { Handler } from '../../src/handler/base.class';
export default (modelCreator: () => Promise<FilterModel>) => {
  let model: FilterModel;
  let addOneHandler: Handler<number,number>;
  let registrations:HandlerRegistration[];
  let errorHandler: Handler<number,number>;
  beforeEach(async() => {
    addOneHandler = Handler.fromCback<number,number>('addOne', (number, c) => c(null, number + 1));
    errorHandler = Handler.fromCback<number,number>('doError', (number, c) => c(new Error('haha'), null));
    model = await modelCreator();
    registrations = [];
  });

  afterEach(async() => {
    for (let i=0; i<registrations.length; i++) {
      await registrations[i].unregister();
    }
  });

  async function register<T>(model:FilterModel, obj: {hookSystem: BaseHookSystem<T>, handler:  Handler<T,any>, priority?: number}): Promise<HandlerRegistration>{
    let reg = await model.registerHandler(obj);
    registrations.push(reg);
    return reg;
  }

  describe('queryHandlers/registerHandler', () => {
    it('should return empty query handlers when nothing is registered', async() => {
      let filter = new BaseHookSystem('base', model);
      const res  = await model.queryHandlers(filter);
      expect(res).is.deep.eq([])
    });
    it('should return empty handlers if there are some registered for other key', async() => {
      let filter = new BaseHookSystem('base', model);
      await model.registerHandler({hookSystem: filter, handler: addOneHandler});
      let emptyFilter = new BaseHookSystem('empty', model);
      const res = await model.queryHandlers(emptyFilter);
      expect(res).is.deep.eq([])
    });
    it('should return single element if only one registered', async () => {
      let filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, handler: addOneHandler})
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(1);
      expect(res[0].key).is.deep.eq(addOneHandler.key);
    });

    it('should return multiple elements', async() => {
      let filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, priority:10, handler: addOneHandler});
      await register(model, {hookSystem: filter, priority:20, handler: errorHandler});
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(2);
      expect(res[0].key).is.deep.eq(addOneHandler.key);
      expect(res[1].key).is.deep.eq(errorHandler.key);
    });

    it('should return multiple elements ordered', async() => {
      let filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, priority:20, handler: errorHandler});
      await register(model, {hookSystem: filter, priority:10, handler: addOneHandler});
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(2);
      expect(res[0].key).is.deep.eq(addOneHandler.key);
      expect(res[1].key).is.deep.eq(errorHandler.key);
    });

    it('readding same item twice wont change the number of handlers but the order', async() => {
      let filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, priority:10, handler: addOneHandler});
      await register(model, {hookSystem: filter, priority:15, handler: errorHandler});
      await register(model, {hookSystem: filter, priority:20, handler: addOneHandler});
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(2);
      expect(res[0].key).is.deep.eq(errorHandler.key);
      expect(res[1].key).is.deep.eq(addOneHandler.key);
    });

    describe('register/unregister', () => {
      it('should exclude handler if registered and then unregistered', async() => {
        let filter = new BaseHookSystem('base', model);
        let reg = await register(model, {hookSystem: filter, priority:10, handler: addOneHandler});
        await reg.unregister();
        const res = await model.queryHandlers(filter);
        expect(res.length).is.deep.eq(0);
      });
      it ('should return unmanipulated element if Handler was unregistered in the meanwhile', async() => {
        let filter = new BaseHookSystem('base', model);
        let reg = await register(model, {hookSystem: filter, priority:10, handler: addOneHandler});
        const res = await model.queryHandlers(filter);
        await reg.unregister();

        const finalRes = await res[0].handle(1);
        expect(finalRes).to.be.deep.eq(1);
      })
    });
  });

  it('should preserve original handler should be called somehow when called from queryHandlers result', async () => {
    let filter = new BaseHookSystem('base', model);
    await register(model, {hookSystem: filter, handler: addOneHandler});
    const res = await model.queryHandlers(filter);

    const finalRes = await res[0].handle(1);
    expect(finalRes).to.be.deep.eq(1+1);
  });

}