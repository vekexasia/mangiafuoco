import { Handler } from '../handler';
import { BaseHookSystem } from '../hooksystems';

export interface IHandlerRegistration {
  id: string;

  unregister(): Promise<boolean>;
}

export interface IFilterModel {
  queryHandlers<T>(filter: BaseHookSystem<T>): Promise<Array<Handler<T, any>>>;

  // tslint:disable-next-line
  registerHandler<T>(obj: { hookSystem: BaseHookSystem<T>, handler: Handler<T, any>, priority?: number }): Promise<IHandlerRegistration>;

}
