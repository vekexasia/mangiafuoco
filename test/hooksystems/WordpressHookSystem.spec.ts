import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { SinonSpy, SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { InMemoryFilterModel } from '../../src/filtermodel';
import { Handler } from '../../src/handler';
import { EasyHookSystem } from '../../src/hooksystems';
import { WordPressHookSystem } from '../../src/hooksystems';
import { OnWPAction, OnWPFilter, WPHooksSubscriber } from '../../src/hooksystems/decorators/';

chai.use(chaiAsPromised);
const {expect} = chai;
// tslint:disable no-unused-expression no-string-literal
describe('HookSystems', () => {
  describe('WordpressHookSystem', () => {
    let wpHookSystem: WordPressHookSystem;
    let easyHookSystem: EasyHookSystem;
    let easyHookSpies: { do: SinonSpy, register: SinonSpy, map: SinonSpy, series: SinonSpy };
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
        series  : sinon.spy(easyHookSystem, 'series'),
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
      it('should call easyHookSystem .series with args provided', async () => {
        await wpHookSystem.do_action('theAction', 'thePayload');
        expect(easyHookSpies.series.called).is.true;
        expect(easyHookSpies.series.calledWith('action_theAction', 'thePayload')).is.true;
      });
      it('should return undefined resolved promise', async () => {
        const ret = await wpHookSystem.do_action('theAction', 'thePayload');
        expect(ret).is.undefined;
      });
    });

    describe('do_action_parallel', () => {
      it('should call easyHookSystem.do', async () => {
        await wpHookSystem.do_action_parallel('theAction', 'thePayload');
        expect(easyHookSpies.do.called).is.true;
        expect(easyHookSpies.do.calledWith('action_theAction', 'thePayload')).is.true;
      });
      it('should return array resolved promise', async () => {
        const ret = await wpHookSystem.do_action_parallel('theAction', 'thePayload');
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

      class Test extends WPHooksSubscriber(Object) {

        public stub: SinonStub = sinon.stub().throws('stub');

        @OnWPAction(() => wpHookSystem, 'thaAction')
        public async onAction(...args) {
          this.stub(...args);
        }
      }

      class Test2 extends WPHooksSubscriber(Object) {
        public stub: SinonStub  = sinon.stub().throws('stub');
        public stub2: SinonStub = sinon.stub().throws('stub2');
        public stub3: SinonStub = sinon.stub().throws('stub3');
        public stub4: SinonStub = sinon.stub().throws('stub4');
        public stub5: SinonStub = sinon.stub().throws('stub5');
        public stub6: SinonStub = sinon.stub().throws('stub6');
        public stub7: SinonStub = sinon.stub().throws('stub7');
        public hookSystem: WordPressHookSystem = wpHookSystem;

        @OnWPAction(() => wpHookSystem, 'thaAction')
        public async onActionDiffName(...args) {
          this.stub(...args);
        }

        @OnWPAction(() => wpHookSystem, 'thaAction2')
        public async onAction2(...args) {
          this.stub2(...args);
        }

        @OnWPAction(() => wpHookSystem, 'thaAction2', 1)
        @OnWPAction(() => wpHookSystem, 'thaAction2', 11)
        public async onAction2PrePost(...args) {
          this.stub3(...args);
        }

        @OnWPFilter(() => wpHookSystem, 'hook', 1)
        public async filterOnly(...args) {
          return this.stub4(...args);
        }

        @OnWPAction(() => wpHookSystem, 'hook', 1)
        public async actionHook() {
          return this.stub5();
        }

        @OnWPFilter(() => wpHookSystem, 'hook', 2)
        public async filterOnly2(...args) {
          return this.stub6(...args);
        }

        @OnWPAction('hook', -1)
        @OnWPAction('hook', 2)
        public withDefault(): Promise<void> {
          return this.stub7();
        }
      }

      describe('WPHooksSubscriber', () => {
        describe('OnWpAction', () => {
          it('should call Test.thaAction', async () => {
            const t = new Test();
            await t.hookMethods();
            t.stub.returns(null);
            await wpHookSystem.do_action('thaAction');
            expect(t.stub.calledOnce).is.true;
            expect(t.stub.firstCall.args).deep.eq([undefined]);
          });
          it('should propagate params', async () => {
            const t = new Test();
            await t.hookMethods();
            t.stub.returns(null);
            await wpHookSystem.do_action('thaAction', 'one', 'two', 'three');
            expect(t.stub.calledOnce).is.true;
            expect(t.stub.firstCall.args).deep.eq(['one', 'two', 'three']);
          });
          it('should allow multiple registration and honor priorities', async () => {
            const t2 = new Test2();
            await t2.hookMethods();
            t2.stub2.returns(null);
            t2.stub3.returns(null);
            await wpHookSystem.do_action('thaAction2', 'one', 'two', 'three');
            expect(t2.stub2.calledOnce).is.true;
            expect(t2.stub3.calledTwice).is.true;
            expect(t2.stub3.firstCall.calledBefore(t2.stub2.firstCall)).is.true;
            expect(t2.stub3.secondCall.calledAfter(t2.stub2.firstCall)).is.true;

          });
          it('should always pass same arguments to all registered actions', async () => {
            const t2 = new Test2();
            await t2.hookMethods();
            t2.stub3.returns('a');
            t2.stub2.returns('b');

            await wpHookSystem.do_action('thaAction2', 'one', 'two', 'three');

            expect(t2.stub2.firstCall.args).deep.eq(['one', 'two', 'three']);
            expect(t2.stub3.firstCall.args).deep.eq(['one', 'two', 'three']);
            expect(t2.stub3.secondCall.args).deep.eq(['one', 'two', 'three']);

          });
          it('multiple instances', async () => {
            const t2   = new Test2();
            const t2_1 = new Test2();
            await t2.hookMethods();
            await t2_1.hookMethods();
            t2.stub.returns(null);
            t2_1.stub.returns(null);
            await wpHookSystem.do_action('thaAction', 'one', 'two', 'three');
            expect(t2_1.stub.calledOnce).is.true;
            expect(t2.stub.calledOnce).is.true;
          });

          it('unHook() should unregister all hooks', async () => {
            const t2 = new Test2();
            await t2.hookMethods();
            await t2.unHook();
            await wpHookSystem.do_action('thaAction', 'one', 'two', 'three');
          });
          it('shouldnt do nothing if hookMethods was not called', async () => {
            // all stubs throws so the fact that this does not throws means that there was no registered hooks
            await wpHookSystem.do_action('thaAction', 'one', 'two', 'three');
          });
          it('shouldnt allow 2 hookMethods', async () => {
            const t2 = new Test2();
            await t2.hookMethods();
            await expect(t2.hookMethods()).rejectedWith('Hooks already bound');
          });
          it('should call hook on both methods', async () => {
            const t2 = new Test2();
            await t2.hookMethods();
            t2.stub5.returns(null);
            t2.stub7.returns(null);
            await wpHookSystem.do_action('hook');
            expect(t2.stub5.calledOnce).true;
            expect(t2.stub7.calledTwice).true;
            expect(t2.stub7.firstCall.calledBefore(t2.stub5.firstCall)).true;
            expect(t2.stub7.secondCall.calledAfter(t2.stub5.firstCall)).true;
          });
        });
        describe('OnWpFilter', () => {
          it('should call hook and remap result properly by preserving priority', async () => {
            const t2 = new Test2();
            await t2.hookMethods();
            t2.stub4.returns('meow');
            t2.stub6.returns('gluglu');
            const res = await wpHookSystem.apply_filters('hook', 'woof');
            expect(res).eq('gluglu');
            expect(t2.stub6.calledAfter(t2.stub4)).true;
            expect(t2.stub4.firstCall.args[0]).eq('woof');
            expect(t2.stub6.firstCall.args[0]).eq('meow');
          });
        });
      });

    });
  });

});
