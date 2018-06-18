import { expect } from 'chai';
import { IFilterModel, IHandlerRegistration } from '../../src/filtermodel/';
import { Handler } from '../../src/handler/';
import { BaseHookSystem } from '../../src/hooksystems/';

export default (modelCreator: () => Promise<IFilterModel>) => {
  let model: IFilterModel;
  let addOneHandler: Handler<number, number>;
  let registrations: IHandlerRegistration[];
  let errorHandler: Handler<number, number>;
  beforeEach(async () => {
    addOneHandler = Handler.fromCback<number, number>('addOne', (n, c) => c(null, n + 1));
    errorHandler  = Handler.fromCback<number, number>('doError', (n, c) => c(new Error('haha'), null));
    model         = await modelCreator();
    registrations = [];
  });

  afterEach(async () => {
    for (const registration of registrations) {
      await registration.unregister();
    }
  });

  // tslint:disable-next-line
  async function register<T>(m: IFilterModel, obj: { hookSystem: BaseHookSystem<T>, handler: Handler<T, any>, priority?: number }): Promise<IHandlerRegistration> {
    const reg = await m.registerHandler(obj);
    registrations.push(reg);
    return reg;
  }

  describe('queryHandlers/registerHandler', () => {
    it('should return empty query handlers when nothing is registered', async () => {
      const filter = new BaseHookSystem('base', model);
      const res    = await model.queryHandlers(filter);
      expect(res).is.deep.eq([]);
    });
    it('should return empty handlers if there are some registered for other key', async () => {
      const filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, handler: addOneHandler});
      const emptyFilter = new BaseHookSystem('empty', model);
      const res         = await model.queryHandlers(emptyFilter);
      expect(res).is.deep.eq([]);
    });
    it('should return single element if only one registered', async () => {
      const filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, handler: addOneHandler});
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(1);
      expect(res[0].key).is.deep.eq(addOneHandler.key);
    });

    it('should return multiple elements', async () => {
      const filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, priority: 10, handler: addOneHandler});
      await register(model, {hookSystem: filter, priority: 20, handler: errorHandler});
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(2);
      expect(res[0].key).is.deep.eq(addOneHandler.key);
      expect(res[1].key).is.deep.eq(errorHandler.key);
    });

    it('should return multiple elements ordered', async () => {
      const filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, priority: 20, handler: errorHandler});
      await register(model, {hookSystem: filter, priority: 10, handler: addOneHandler});
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(2);
      expect(res[0].key).is.deep.eq(addOneHandler.key);
      expect(res[1].key).is.deep.eq(errorHandler.key);
    });

    it('readding same item twice wont change the number of handlers but the order', async () => {
      const filter = new BaseHookSystem('base', model);
      await register(model, {hookSystem: filter, priority: 10, handler: addOneHandler});
      await register(model, {hookSystem: filter, priority: 15, handler: errorHandler});
      await register(model, {hookSystem: filter, priority: 20, handler: addOneHandler});
      const res = await model.queryHandlers(filter);
      expect(res.length).is.deep.eq(2);
      expect(res[0].key).is.deep.eq(errorHandler.key);
      expect(res[1].key).is.deep.eq(addOneHandler.key);
    });

    describe('register/unregister', () => {
      it('should exclude handler if registered and then unregistered', async () => {
        const filter = new BaseHookSystem('base', model);
        const reg      = await register(model, {hookSystem: filter, priority: 10, handler: addOneHandler});
        await reg.unregister();
        const res = await model.queryHandlers(filter);
        expect(res.length).is.deep.eq(0);
      });
      it('should return unmanipulated element if Handler was unregistered in the meanwhile', async () => {
        const filter = new BaseHookSystem('base', model);
        const reg      = await register(model, {hookSystem: filter, priority: 10, handler: addOneHandler});
        const res    = await model.queryHandlers(filter);
        await reg.unregister();

        const finalRes = await res[0].handle(1);
        expect(finalRes).to.be.deep.eq(1);
      });
    });
  });

  it('should preserve original handler should be called somehow when called from queryHandlers result', async () => {
    const filter = new BaseHookSystem('base', model);
    await register(model, {hookSystem: filter, handler: addOneHandler});
    const res = await model.queryHandlers(filter);

    expect(await res[0].handle(1)).to.be.deep.eq(1 + 1);
    expect(await res[0].handle(2)).to.be.deep.eq(2 + 1);
  });

};
