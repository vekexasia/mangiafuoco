import { BaseHookSystem } from '../hooksystems/BaseHookSystem.class';
import { Handler } from '../handler/base.class';

export interface HandlerRegistration {
  id: string;
  unregister(): Promise<boolean>
}
export interface FilterModel {
  queryHandlers<T>(filter: BaseHookSystem<T>): Promise<(Handler<T,any>)[]>;

  registerHandler<T>(obj: {hookSystem: BaseHookSystem<T>, handler:  Handler<T,any>, priority?: number}): Promise<HandlerRegistration>;


}