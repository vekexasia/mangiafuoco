import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { SinonSpy, SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { InMemoryFilterModel } from '../../src/filtermodel';
import { Handler } from '../../src/handler';
import { EasyHookSystem, WPAction, WPFilter } from '../../src/hooksystems';
import { WordPressHookSystem } from '../../src/hooksystems';

chai.use(chaiAsPromised);
const {expect} = chai;
// tslint:disable no-unused-expression no-string-literal
describe('HookSystems', () => {
  describe('WordpressHookSystem', () => {
    let wpHookSystem: WordPressHookSystem;
    let easyHookSystem: EasyHookSystem;
    let easyHookSpies: { do: SinonSpy, register: SinonSpy, map: SinonSpy };
    const uselessHandler = Handler.fromCback('h', (a, b) => b(null, 1));
    let wpSpies: {
      add: SinonSpy,
      remove: SinonSpy
    };
    beforeEach(() => {
      const mockModel = new InMemoryFilterModel();
      easyHookSystem  = new EasyHookSystem(mockModel);
      easyHookSpies   = {
        do      : sinon.spy(easyHookSystem, 'do'),
        map     : sinon.spy(easyHookSystem, 'map'),
        register: sinon.spy(easyHookSystem, 'register'),
      };
      wpHookSystem    = new WordPressHookSystem(mockModel, easyHookSystem);
      wpSpies         = {
        add   : sinon.spy(wpHookSystem as any, 'add'),
        remove: sinon.spy(wpHookSystem as any, 'remove'),
      };
    });
    describe('wrappers', () => {
      ['action', 'filter'].forEach((which) => {
        it(`add_${which} should call add with '${which}' as first param forwarding the others`, async () => {
          await wpHookSystem[`add_${which}`]('what', uselessHandler, 11);
          expect(wpSpies.add.calledWith(which, 'what', uselessHandler, 11)).is.true;
        });
        it(`remove_${which} should call remove with '${which}' as first param forwarding the others`, async () => {
          const toRet = await wpHookSystem[`remove_${which}`]('what', uselessHandler, 11);
          expect(wpSpies.remove.calledWith(which, 'what', uselessHandler, 11)).is.true;

          expect(toRet).to.be.false; // unregistered means fals in unregister.
        });
      });

    });

    describe('do_action', () => {
      it('should call easyHookSystem .do with args provided', async () => {
        await wpHookSystem.do_action('theAction', 'thePayload');
        expect(easyHookSpies.do.called).is.true;
        expect(easyHookSpies.do.calledWith('action_theAction', 'thePayload')).is.true;
      });
      it('should return the same promise returned by easyHookSystem.do (empty array)', async () => {
        const ret = await wpHookSystem.do_action('theAction', 'thePayload');
        expect(ret).is.deep.eq([]);
      });
    });
    describe('apply_filters', () => {
      it('should call easyHookSystem .map with args provided', async () => {
        await wpHookSystem.apply_filters('theFilter', 'thePayload');
        expect(easyHookSpies.map.called).is.true;
        expect(easyHookSpies.map.calledWith('filter_theFilter', 'thePayload')).is.true;
      });
      it('should return the same promise returned by easyHookSystem.do (orig payload)', async () => {
        const ret = await wpHookSystem.apply_filters('theAction', 'thePayload');
        expect(ret).is.deep.eq('thePayload');
      });

      it('registering same filter diff priorities should call it twice', async () => {
        const theSpy  = sinon.spy((what: number, cback) => cback(null, what * 2));
        const handler = Handler.fromCback('multiplyByTwo', theSpy);
        await wpHookSystem.add_filter('on_number', handler, 10);
        await wpHookSystem.add_filter('on_number', handler, 20);

        const ret = await wpHookSystem.apply_filters('on_number', 2);
        expect(theSpy.calledTwice).is.true;
        expect(ret).is.eq(2 * 2 * 2);

      });
      it('registering same filter =  priorities should call it once', async () => {
        const theSpy  = sinon.spy((what: number, cback) => cback(null, what * 2));
        const handler = Handler.fromCback('multiplyByTwo', theSpy);
        await wpHookSystem.add_filter('on_number', handler, 10);
        await wpHookSystem.add_filter('on_number', handler, 10);

        const ret = await wpHookSystem.apply_filters('on_number', 2);
        expect(theSpy.calledOnce).is.true;
        expect(ret).is.eq(2 * 2);
      });
      it('registering same filter diff priorities and then remove one should call it once', async () => {
        const theSpy  = sinon.spy((what: number, cback) => cback(null, what * 2));
        const handler = Handler.fromCback('multiplyByTwo', theSpy);
        await wpHookSystem.add_filter('on_number', handler, 10);
        await wpHookSystem.add_filter('on_number', handler, 20);
        await wpHookSystem.remove_filter('on_number', handler, 10);

        const ret = await wpHookSystem.apply_filters('on_number', 2);
        expect(theSpy.calledOnce).is.true;
        expect(ret).is.eq(2 * 2);
      });
      it('should preserve ordering', async () => {
        const theSpy   = sinon.spy((what: number, cback) => cback(null, what * 2));
        const handler  = Handler.fromCback('multiplyBy2', theSpy);
        const theSpy2  = sinon.spy((what: number, cback) => cback(null, what + 2));
        const handler2 = Handler.fromCback('add2', theSpy2);
        const theSpy3  = sinon.spy((what: number, cback) => cback(null, Math.pow(what, 3)));
        const handler3 = Handler.fromCback('pow3', theSpy3);

        await wpHookSystem.add_filter('on_number', handler3, 12);
        await wpHookSystem.add_filter('on_number', handler2, 11);
        await wpHookSystem.add_filter('on_number', handler, 10);
        const ret = await wpHookSystem.apply_filters('on_number', 2);
        expect(ret).eq(Math.pow(2 * 2 + 2, 3));
        // ordering is verified by math. but for the sake of clarity.

        expect(theSpy.calledBefore(theSpy2));
        expect(theSpy2.calledBefore(theSpy3));
      });
    });

    describe('decorators', () => {
      class Test {
        @WPAction(() => wpHookSystem)
        public async action(a: number, b: string) {
          return `action ${a}-${b}`;
        }

        @WPFilter(() => wpHookSystem)
        public async filter(a: number, b: string) {
          return `filter ${a}-${b}`;
        }

        @WPFilter(() => wpHookSystem)
        @WPAction(() => wpHookSystem)
        public async both(a: number, b: string) {
          return `filter ${a}-${b}`;
        }

        @WPFilter(() => wpHookSystem, 'meowFilter')
        @WPAction(() => wpHookSystem, 'meowAction')
        @WPAction(() => wpHookSystem, 'meowAction2')
        public async bothCustom(a: number, b: string) {
          return `meowCustom ${a}-${b}`;
        }
      }

      describe('WPAction decorator', () => {
        let preSpy: SinonStub;
        let postSpy: SinonStub;
        beforeEach(async () => {
          preSpy = sinon.stub().resolves();
          postSpy = sinon.stub().resolves();
          await wpHookSystem.add_action('Test.pre.action', new Handler('pre', preSpy));
          await wpHookSystem.add_action('Test.post.action', new Handler('post', postSpy));
        });
        it('should run actions before and after', async () => {
          const t = new Test();
          await t.action(10, 'b');
          expect(preSpy.calledOnce).true;
          expect(postSpy.calledOnce).true;
          expect(preSpy.firstCall.args[0]).deep.eq([10, 'b']);
          expect(postSpy.firstCall.args[0]).deep.eq([10, 'b']);
          expect(preSpy.calledBefore(postSpy)).true;
        });
      });
      describe('WPFilter decorator', () => {
        let postStub: SinonStub;
        let postStub2: SinonStub;
        beforeEach(async () => {
          postStub = sinon.stub().resolves('meow');
          postStub2 = sinon.stub().resolves('woof');
          await wpHookSystem.add_filter('Test.post.filter', new Handler('post', postStub));
          await wpHookSystem.add_filter('Test.post.filter', new Handler('post2', postStub2), 11);
        });
        it('should run filter and return filtered result', async () => {
          const t = new Test();
          const res = await t.filter(10, 'b');
          expect(postStub.calledOnce).true;
          expect(postStub2.calledOnce).true;

          expect(postStub.firstCall.args[0]).eq(`filter ${10}-${'b'}`);
          expect(postStub2.firstCall.args[0]).eq('meow');
          expect(res).eq('woof');
        });
      });

      it('both action and filter', async () => {
        const t = new Test();
        const actionStub = sinon.stub().resolves();
        const filterStub = sinon.stub().resolves('hey');
        await wpHookSystem.add_action('Test.pre.both', new Handler('postActin', actionStub));
        await wpHookSystem.add_filter('Test.post.both', new Handler('filter', filterStub));

        const res = await t.both(10, 'b');
        expect(actionStub.calledOnce).is.true;
        expect(filterStub.calledOnce).is.true;

        expect(res).eq('hey');
      });
      it('multiple and renamed', async () => {
        const t = new Test();
        const actionStub = sinon.stub().resolves();
        const actionStub2 = sinon.stub().resolves();
        const filterStub = sinon.stub().resolves('hey');
        await wpHookSystem.add_action('Test.pre.meowAction', new Handler('postActin', actionStub));
        await wpHookSystem.add_action('Test.pre.meowAction2', new Handler('postActin2', actionStub2));
        await wpHookSystem.add_filter('Test.post.meowFilter', new Handler('filter', filterStub));

        const res = await t.bothCustom(10, 'b');
        expect(actionStub.calledOnce).is.true;
        expect(actionStub2.calledOnce).is.true;
        expect(filterStub.calledOnce).is.true;

        expect(res).eq('hey');
      });
    });
  });

});
