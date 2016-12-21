import { FilterModel, HandlerRegistration } from './filter.model.interface';
import { BaseHookSystem } from '../hooksystems/BaseHookSystem.class';
import { Handler } from '../handler/base.class';

export class InMemoryFilterModel implements FilterModel {
  private data: {
    [filterKey: string]: {
      [handlerKey: string]: {
        priority: number,
        handler: Handler<any,any>;
      }
    }
  } = {};

  async queryHandlers<T>(filter: BaseHookSystem<T>): Promise<Handler<T, any>[]> {

    if (typeof(this.data[filter.baseKey]) == 'undefined') return [];
    const handlers = Object.keys(this.data[filter.baseKey]).map(handlerKey => this.data[filter.baseKey][handlerKey]);
    handlers.sort((a, b) => a.priority - b.priority);
    return handlers.map(w => Handler.fromCback(w.handler.key, async(obj: T, cback) => {
      if (typeof(this.data[filter.baseKey][w.handler.key]) === 'undefined') {
        // if i was unregistered then do not run myself
        return cback(null, obj);
      }
      try {
        return cback(null, await w.handler.handle(obj));
      } catch (e) {
        return cback(e, null);
      }
    }));
  }

  async registerHandler<T>(obj: {hookSystem: BaseHookSystem<T>; handler: Handler<T, any>; priority?: number}): Promise<HandlerRegistration> {
    const {hookSystem, handler} = obj;
    if (typeof(this.data[hookSystem.baseKey]) === 'undefined') {
      this.data[hookSystem.baseKey] = {};
    }
    this.data[hookSystem.baseKey][handler.key] = {
      priority: obj.priority || 10,
      handler : handler
    };
    return {
      id: handler.key,
      unregister: async () => {
        delete this.data[hookSystem.baseKey][handler.key];
        return true;
      }
    }
  }


}