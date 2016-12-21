import { FilterModel, HandlerRegistration } from '../../src/filtermodel/filter.model.interface';
import { stub, SinonStub } from 'sinon';
import { BaseHookSystem } from '../../src/hooksystems/BaseHookSystem.class';
import { Handler } from '../../src/handler/base.class';

export class MockModel implements FilterModel {
  public queryStub: SinonStub;
  public registerStub: SinonStub;
  public handlers: Handler<any, any>[] = [];

  constructor() {
    this.queryStub = this.queryHandlers = stub().returns(new Promise(resolve => resolve(this.handlers)));
    this.registerStub = this.registerHandler = stub().returns(new Promise(resolve => resolve({
      id: 1,
      unregister: async() => true
    })));
  }

  async queryHandlers<T>(filter: BaseHookSystem<T>): Promise<Handler<T, any>[]> {
    return this.handlers;
  }

  registerHandler<T>(obj: {hookSystem: BaseHookSystem<T>; handler: Handler<T, any>; priority?: number}): Promise<HandlerRegistration> {
    return undefined;
  }

}