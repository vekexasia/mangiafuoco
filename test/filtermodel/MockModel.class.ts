import { SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { IFilterModel, IHandlerRegistration } from '../../src/filtermodel';
import { Handler } from '../../src/handler/';
import { BaseHookSystem } from '../../src/hooksystems/';

export class MockModel implements IFilterModel {
  public queryStub: SinonStub;
  public registerStub: SinonStub;
  public handlers: Array<Handler<any, any>> = [];

  constructor() {
    this.queryStub = sinon.stub(this, 'queryHandlers')
      .resolves(this.handlers);

    this.registerStub = sinon.stub(this, 'registerHandler')
      .resolves({
        id: 1,
        unregister() {
          return Promise.resolve(true);
        },
      });
  }

  public queryHandlers<T>(filter: BaseHookSystem<T>) {
    return undefined;
  }

  public registerHandler<T>(obj: { hookSystem: BaseHookSystem<T>; handler: Handler<T, any>; priority?: number }) {
    return undefined;
  }

}