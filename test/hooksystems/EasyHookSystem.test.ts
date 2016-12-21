import { EasyHookSystem } from '../../src/hooksystems/EasyHookSystem.class';
import { MockModel } from '../filtermodel/MockModel.class';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { spy, SinonSpy } from 'sinon';
import { BaseHookSystem } from '../../src/hooksystems/BaseHookSystem.class';

chai.use(chaiAsPromised);
const {expect} = chai;
describe('HookSystems', () => {
  describe('EasyHookSystem', () => {
    let hookSystem: EasyHookSystem;
    let mockModel: MockModel;
    let lastHookSystem: {addHandler: SinonSpy, process: SinonSpy, processParallel: SinonSpy};
    let getFilterSpy: SinonSpy;
    beforeEach(() => {
      mockModel = new MockModel();
      hookSystem = new EasyHookSystem(mockModel);
      const oldGetFilter = hookSystem['getFilter'];
      hookSystem['getFilter'] = (eventName) => {
        const toREet = oldGetFilter.call(hookSystem, eventName) as BaseHookSystem<any>;
        lastHookSystem = {} as any;
        lastHookSystem.addHandler = spy(toREet, 'addHandler');
        lastHookSystem.process = spy(toREet, 'process');
        lastHookSystem.processParallel = spy(toREet, 'processParallel');
        return toREet;
      };

      getFilterSpy = spy(hookSystem, 'getFilter');
    });
    describe('.register', () => {
      it('should call getfilter with "event" and call addHandler on the result', async() => {
        await hookSystem.register('event', null);
        expect(getFilterSpy.calledWith('event')).is.true;
        expect(lastHookSystem.addHandler.calledWith({handler: null, priority: 10})).is.true;
      });
    });

    describe('.do', () => {
      it('should call getFilter with "event"', async() => {
        await hookSystem.do('event', null);
        expect(getFilterSpy.calledWith('event')).is.true;
      });
      it('should call processParallel on the HookSystem', async() => {
        await hookSystem.do('event', 'payload');
        expect(lastHookSystem.processParallel.calledWith('payload')).is.true;
      });
    });

    describe('.map', () => {
      it('should call getFilter with "event"', async() => {
        await hookSystem.map('event', null);
        expect(getFilterSpy.calledWith('event')).is.true;
      });
      it('should call process on the HookSystem', async() => {
        await hookSystem.map('event', 'payload');
        expect(lastHookSystem.process.calledWith('payload')).is.true;
      });
    });

    describe('.enqueueDo', () => {
      it('should immediately return true', () => {
        const ret = hookSystem.enqueueDo('event', null);
        expect(ret).to.be.true;
      });
      it('should eventually call .do', async() => {
        const doSpy = spy(hookSystem, 'do');
        hookSystem.enqueueDo('event', null);
        expect(doSpy.called).is.false;
        await new Promise(resolve => setTimeout(resolve, 10));
        // now it s called
        expect(doSpy.called).is.true;
      });

    });
  });
});