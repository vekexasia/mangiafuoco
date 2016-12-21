import { BaseHookSystem } from '../../src/hooksystems/BaseHookSystem.class';
import { MockModel } from '../filtermodel/MockModel.class'
import { FilterModel } from '../../src/filtermodel/filter.model.interface';
import {expect} from 'chai';
import { Handler } from '../../src/handler/base.class';

describe('HookSystems', () => {
  describe('Base', () => {
    describe('addHandler', () => {
      let hookSystem:BaseHookSystem<number>;
      let mockModel: MockModel;
      beforeEach(() => {
        mockModel = new MockModel();
        hookSystem = new BaseHookSystem('key', mockModel)
      });
      it ('should call registerHandler', async () => {
        await hookSystem.addHandler({handler:null});
        expect(mockModel.registerStub.called).is.true;
        expect(mockModel.registerStub.calledOnce).is.true;
      });
      it ('should pass given handler', async() => {
        await hookSystem.addHandler({handler:1} as any);
        expect(mockModel.registerStub.firstCall.args[0].handler).is.eq(1);
      });
      it ('should pass given priority', async() => {
        await hookSystem.addHandler({priority: 1} as any);
        expect(mockModel.registerStub.firstCall.args[0].priority).is.eq(1);
      });
      it ('should pass given priority', async() => {
        await hookSystem.addHandler({priority: 1} as any);
        expect(mockModel.registerStub.firstCall.args[0].priority).is.eq(1);
      });
    });
  });
});