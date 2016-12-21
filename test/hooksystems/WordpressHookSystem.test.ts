import { EasyHookSystem } from '../../src/hooksystems/EasyHookSystem.class';
import { WordPressHookSystem } from '../../src/hooksystems/WordpressHookSystem.class';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { spy, SinonSpy } from 'sinon';
import { Handler } from '../../src/handler/base.class';
import { InMemoryFilterModel } from '../../src/filtermodel/inmemoryfiltermodel.class';

chai.use(chaiAsPromised);
const {expect} = chai;
describe('HookSystems', () => {
  describe('WordpressHookSystem', () => {
    let wpHookSystem: WordPressHookSystem;
    let easyHookSystem: EasyHookSystem;
    let easyHookSpies: {do: SinonSpy, register: SinonSpy, map: SinonSpy};
    const uselessHandler = Handler.fromCback('h', (a, b) => b(null, 1));
    let wpSpies: {
      add: SinonSpy,
      remove: SinonSpy
    };
    beforeEach(() => {
      const mockModel = new InMemoryFilterModel();
      easyHookSystem = new EasyHookSystem(mockModel);
      easyHookSpies = {
        do: spy(easyHookSystem, 'do'),
        register: spy(easyHookSystem, 'register'),
        map: spy(easyHookSystem, 'map'),
      };
      wpHookSystem = new WordPressHookSystem(mockModel, easyHookSystem);
      wpSpies = {
        add: spy(wpHookSystem, 'add'),
        remove: spy(wpHookSystem, 'remove'),
      };
    });
    describe('wrappers', () => {
      ['action', 'filter'].forEach(which => {
        it(`add_${which} should call add with '${which}' as first param forwarding the others`, async() => {
          await wpHookSystem[`add_${which}`]('what', uselessHandler, 11);
          expect(wpSpies.add.calledWith(which, 'what', uselessHandler, 11)).is.true;
        });
        it(`remove_${which} should call remove with '${which}' as first param forwarding the others`, async() => {
          const toRet = await wpHookSystem[`remove_${which}`]('what', uselessHandler, 11);
          expect(wpSpies.remove.calledWith(which, 'what', uselessHandler, 11)).is.true;

          expect(toRet).to.be.false; // unregistered means fals in unregister.
        });
      });

    });

    describe('do_action', () => {
      it('should call easyHookSystem .do with args provided', async() => {
        await wpHookSystem.do_action('theAction', 'thePayload');
        expect(easyHookSpies.do.called).is.true;
        expect(easyHookSpies.do.calledWith('theAction', 'thePayload')).is.true;
      });
      it('should return the same promise returned by easyHookSystem.do (empty array)', async() => {
        const ret = await wpHookSystem.do_action('theAction', 'thePayload');
        expect(ret).is.deep.eq([]);
      });
    });
    describe('apply_filters', () => {
      it('should call easyHookSystem .map with args provided', async() => {
        await wpHookSystem.apply_filters('theFilter', 'thePayload');
        expect(easyHookSpies.map.called).is.true;
        expect(easyHookSpies.map.calledWith('theFilter', 'thePayload')).is.true;
      });
      it('should return the same promise returned by easyHookSystem.do (orig payload)', async() => {
        const ret = await wpHookSystem.apply_filters('theAction', 'thePayload');
        expect(ret).is.deep.eq('thePayload');
      });

      it('registering same filter diff priorities should call it twice', async() => {
        const theSpy = spy((what: number, cback) => cback(null, what * 2));
        const handler = Handler.fromCback('multiplyByTwo', theSpy);
        await wpHookSystem.add_filter('on_number', handler, 10);
        await wpHookSystem.add_filter('on_number', handler, 20);

        const ret = await wpHookSystem.apply_filters('on_number', 2);
        expect(theSpy.calledTwice).is.true;
        expect(ret).is.eq(2 * 2 * 2);

      });
      it('registering same filter =  priorities should call it once', async() => {
        const theSpy = spy((what: number, cback) => cback(null, what * 2));
        const handler = Handler.fromCback('multiplyByTwo', theSpy);
        await wpHookSystem.add_filter('on_number', handler, 10);
        await wpHookSystem.add_filter('on_number', handler, 10);

        const ret = await wpHookSystem.apply_filters('on_number', 2);
        expect(theSpy.calledOnce).is.true;
        expect(ret).is.eq(2 * 2);
      });
      it('registering same filter diff priorities and then remove one should call it once', async() => {
        const theSpy = spy((what: number, cback) => cback(null, what * 2));
        const handler = Handler.fromCback('multiplyByTwo', theSpy);
        await wpHookSystem.add_filter('on_number', handler, 10);
        await wpHookSystem.add_filter('on_number', handler, 20);
        await wpHookSystem.remove_filter('on_number', handler, 10);

        const ret = await wpHookSystem.apply_filters('on_number', 2);
        expect(theSpy.calledOnce).is.true;
        expect(ret).is.eq(2 * 2);
      });
    });
  });
});