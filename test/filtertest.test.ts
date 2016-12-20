import { Filter } from '../src/worker';
import { expect } from 'chai';
import { InMemoryFilterModel } from '../src/filtermodel/inmemoryfiltermodel.class';
import { Handler } from '../src/handler/base.class';
import { spy } from 'sinon';

describe('FilterTest', () => {
  describe('addHandler', () => {
    it('should call model addHandler method', async () => {
      let inMemoryFilterModel = new InMemoryFilterModel();
      let filter = new Filter<number>("adder", inMemoryFilterModel);
      const theSpy = spy(inMemoryFilterModel, 'registerHandler');
      let handler = Handler.fromCback('haha', () => {
      });
      await filter.addHandler({handler});
      expect(theSpy.called).is.true;
      expect(theSpy.callCount).is.eq(1);
      expect(theSpy.args[0][0].filter).is.eq(filter);
      expect(theSpy.args[0][0].handler).is.eq(handler);
    });
  });
  describe('process', () => {
    let filter;
    beforeEach(() => {
      filter = new Filter<number>("adder", new InMemoryFilterModel());
    });

    it ('shouldnt do anything and return original value if no handlers', async () => {
      let res = await filter.process(1);
      expect(res).is.eq(1);
    });

    it('should call handler and return manipulated value', async () => {
      await filter.addHandler({handler: Handler.fromCback('handler', (o:number, cback) => cback(null, o+1))})
      expect(await filter.process(1)).is.eq(2);
    });

    it('should call handlers in order', async () => {
      await filter.addHandler({priority: 11, handler: Handler.fromCback('handler', (o:number, cback) => cback(null, o/2))});
      await filter.addHandler({priority: 10, handler: Handler.fromCback('handler1', (o:number, cback) => cback(null, o+1))});
      expect(await filter.process(2)).is.eq(1.5);
    });
  });

  describe('processParallel', () => {
    let filter;
    beforeEach(() => {
      filter = new Filter<number>("adder", new InMemoryFilterModel());
    });

    it ('shouldnt do anything and return empty array if no handlers', async () => {
      expect(await filter.processParallel(1)).is.deep.eq([]);
    });
    it('should call all handlers and return arr of all mapped results in order', async () => {
      await filter.addHandler({priority: 11, handler: Handler.fromCback('handler', (o:number, cback) => cback(null, o/2))});
      await filter.addHandler({priority: 10, handler: Handler.fromCback('handler1', (o:number, cback) => cback(null, o+1))});

      expect(await filter.processParallel(2)).is.deep.eq([
        2+1,
        2/2
      ]);
    });
  });

  describe('unregister', () => {

  })

});
