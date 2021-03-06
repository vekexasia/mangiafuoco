import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { spy } from 'sinon';
import { Handler } from '../../src/handler';
import { BaseHookSystem } from '../../src/hooksystems';
import { MockModel } from '../filtermodel/MockModel.class';

chai.use(chaiAsPromised);
const {expect} = chai;
// tslint:disable no-unused-expression

describe('HookSystems', () => {
  describe('Base', () => {
    let hookSystem: BaseHookSystem<number>;
    let mockModel: MockModel;
    beforeEach(() => {
      mockModel  = new MockModel();
      hookSystem = new BaseHookSystem('key', mockModel);
    });
    describe('addHandler', () => {

      it('should call registerHandler', async () => {
        await hookSystem.addHandler({handler: null});
        expect(mockModel.registerStub.called).is.true;
        expect(mockModel.registerStub.calledOnce).is.true;
      });
      it('should pass given handler', async () => {
        await hookSystem.addHandler({handler: 1} as any);
        expect(mockModel.registerStub.firstCall.args[0].handler).is.eq(1);
      });
      it('should pass given priority', async () => {
        await hookSystem.addHandler({priority: 1} as any);
        expect(mockModel.registerStub.firstCall.args[0].priority).is.eq(1);
      });
      it('should pass itself in "hookSystem" field', async () => {
        await hookSystem.addHandler({} as any);
        expect(mockModel.registerStub.firstCall.args[0].hookSystem).is.deep.eq(hookSystem);
      });
      it('should return the registation provided by the model', async () => {
        const toRet = {id: 'myid', unregister: 'haha'};
        mockModel.registerStub.resolves(toRet);
        const reg = await hookSystem.addHandler({} as any);
        expect(reg).to.be.deep.eq(toRet);
      });
    });

    describe('seriesMap', () => {
      it('should call queryHandlers passing itself as only arg', async () => {
        await hookSystem.seriesMap(1);
        expect(mockModel.queryStub.called).is.true;
        expect(mockModel.queryStub.calledOnce).is.true;
        expect(mockModel.queryStub.firstCall.args[0]).is.deep.eq(hookSystem);
      });
      it('should return original object if no query handlers', async () => {
        expect(await hookSystem.seriesMap(1)).is.eq(1);
        expect(await hookSystem.seriesMap(2)).is.eq(2);
        expect(await hookSystem.seriesMap({a: 'b'} as any)).is.deep.eq({a: 'b'});
      });
      it('should resolve all query sequentially passing value to next handler', async () => {
        const theSpyFirst = spy((n: number, cback) => cback(null, n + 1));
        const theSpyLast  = spy((n: number, cback) => cback(null, n / 2));
        mockModel.handlers.push(Handler.fromCback('addOne', theSpyFirst));
        mockModel.handlers.push(Handler.fromCback('divideByTwo', theSpyLast));
        expect(await hookSystem.seriesMap(1)).is.eq(1);
        expect(await hookSystem.seriesMap(2)).is.eq(1.5);
        expect(await hookSystem.seriesMap(3)).is.eq(2);

        // ordering test
        expect(theSpyFirst.calledBefore(theSpyLast)).is.true;
      });
      it('should throw error if one handler is throwing error and avoid calling subsequent handlers', async () => {
        const theSpyLast = spy((n: number, cback) => cback(null, n / 2));
        mockModel.handlers.push(Handler.fromCback('addOne', (n: number, cback) => cback(null, n + 1)));
        mockModel.handlers.push(Handler.fromCback('throwError', (n: number, cback) => cback(new Error('shit'), null)));
        mockModel.handlers.push(Handler.fromCback('divideByTwo', theSpyLast));
        await expect(hookSystem.seriesMap(1)).to.eventually.not.be.rejectedWith('shit');
        expect(theSpyLast.called).is.false;
      });
    });

    describe('series', () => {
      it('should call all handlers with original args', async () => {
        const theSpyFirst = spy((n: number, cback) => cback(null, n + 2));
        const theSpyLast  = spy((n: number, cback) => cback(null, n / 2));
        mockModel.handlers.push(Handler.fromCback('addOne', theSpyFirst));
        mockModel.handlers.push(Handler.fromCback('divideByTwo', theSpyLast));

        await expect(hookSystem.series(1, 'a', 'b', 'c')).to.fulfilled;
        expect(theSpyLast.firstCall.args.slice(2)).deep.eq(['a', 'b', 'c']);
        expect(theSpyFirst.firstCall.args.slice(2)).deep.eq(['a', 'b', 'c']);
        expect(theSpyLast.firstCall.args[0]).deep.eq(1);
        expect(theSpyFirst.firstCall.args[0]).deep.eq(1);

      });
      it('should throw error if one handler is throwing and stop execution', async () => {
        const theSpyLast = spy((n: number, cback) => cback(null, n / 2));
        mockModel.handlers.push(Handler.fromCback('addOne', (n: number, cback) => cback(null, n + 1)));
        mockModel.handlers.push(Handler.fromCback('throwError', (n: number, cback) => cback(new Error('shit'), null)));
        mockModel.handlers.push(Handler.fromCback('divideByTwo', theSpyLast));
        await expect(hookSystem.series(1)).to.eventually.not.be.rejectedWith('shit');
        expect(theSpyLast.called).is.false;
      })
    });

    describe('parallel', () => {
      it('should call queryHandlers', async () => {
        await hookSystem.parallel(1);
        expect(mockModel.queryStub.called).is.true;
        expect(mockModel.queryStub.calledOnce).is.true;
        expect(mockModel.queryStub.firstCall.args[0]).is.deep.eq(hookSystem);
      });

      it('should return empty array for no queryHandlers', async () => {
        const ret = await hookSystem.parallel(1);
        expect(ret).to.be.deep.eq([]);
      });

      it('should return array with ordered values returned by handlers', async () => {
        // first takes 100ms to complete
        mockModel.handlers.push(Handler.fromCback('addTwoT100',
          (n: number, cback) => setTimeout(() => cback(null, n + 2), 100)));
        // second takes 50ms to complete
        mockModel.handlers.push(Handler.fromCback('addOneT50',
          (n: number, cback) => setTimeout(() => cback(null, n + 1), 50)));
        // third takes 20ms to complete
        mockModel.handlers.push(Handler.fromCback('divByTwoT20',
          (n: number, cback) => setTimeout(() => cback(null, n / 2), 20)));
        const ret = await hookSystem.parallel(1);
        // but order is guaranteed.
        expect(ret).to.be.deep.eq([3, 2, 0.5]);
      });

      it('should throw error if one fails', async () => {
        const theSpyLast = spy((n: number, cback) => cback(null, n / 2));
        mockModel.handlers.push(Handler.fromCback('addOne', (n: number, cback) => cback(null, n + 1)));
        mockModel.handlers.push(Handler.fromCback('throwError', (n: number, cback) => cback(new Error('shit'), null)));
        mockModel.handlers.push(Handler.fromCback('divideByTwo', theSpyLast));
        await expect(hookSystem.parallel(1)).to.eventually.not.be.rejectedWith('shit');
        expect(theSpyLast.called).is.true;
      });
    });
  });

});
