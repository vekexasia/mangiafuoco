import { Filter } from '../worker';
import { Handler } from '../handler/base.class';

export interface HandlerRegistration {
  id: string;
  unregister(): Promise<boolean>
}
export interface FilterModel {
  queryHandlers<T>(filter: Filter<T>): Promise<(Handler<T,any>)[]>;

  registerHandler<T>(obj: {filter: Filter<T>, handler:  Handler<T,any>, priority?: number}): Promise<HandlerRegistration>;


}