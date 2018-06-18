import { Handler } from '../handler';
import { BaseHookSystem } from '../hooksystems';
import { IFilterModel, IHandlerRegistration } from './filtermodel';

/**
 * A simple in memory model for filters.
 */
export class InMemoryFilterModel implements IFilterModel {
  private data: {
    [filterKey: string]: {
      [handlerKey: string]: {
        priority: number,
        handler: Handler<any, any>;
      }
    }
  } = {};

  public async queryHandlers<T>(filter: BaseHookSystem<T>): Promise<Array<Handler<T, any>>> {

    if (typeof(this.data[filter.baseKey]) === 'undefined') {
      return [];
    }
    const handlers = Object.keys(this.data[filter.baseKey])
      .map((handlerKey) => this.data[filter.baseKey][handlerKey]);
    handlers.sort((a, b) => a.priority - b.priority);
    return handlers
      .map((w) => Handler
        .fromCback(w.handler.key,
          async (obj: T, cback) => {
            if (typeof(this.data[filter.baseKey][w.handler.key]) === 'undefined') {
              // if i was unregistered then do not run myself
              return cback(null, obj);
            }
            try {
              return cback(null, await w.handler.handle(obj));
            } catch (e) {
              return cback(e, null);
            }
          })
      );
  }

  // tslint:disable-next-line
  public async registerHandler<T>(obj: { hookSystem: BaseHookSystem<T>; handler: Handler<T, any>; priority?: number }): Promise<IHandlerRegistration> {
    const {hookSystem, handler} = obj;
    if (typeof(this.data[hookSystem.baseKey]) === 'undefined') {
      this.data[hookSystem.baseKey] = {};
    }
    this.data[hookSystem.baseKey][handler.key] = {
      handler,
      priority: obj.priority || 10,
    };
    return {
      id        : handler.key,
      unregister: async () => {
        delete this.data[hookSystem.baseKey][handler.key];
        return true;
      },
    };
  }
}
