import { FilterModel } from './filter.model.interface';
import { Filter } from '../worker';
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

  queryHandlers<T>(filter: Filter<T>): Promise<Handler<T, any>[]> {
    return new Promise(resolve => {
      if (typeof(this.data[filter.baseKey]) == 'undefined') return resolve([]);
      const handlers = Object.keys(this.data[filter.baseKey]).map(handlerKey => this.data[filter.baseKey][handlerKey]);
      handlers.sort((a, b) => a.priority - b.priority);
      return resolve(handlers.map(w => w.handler));
    });
  }

  registerHandler<T>(obj: {filter: Filter<T>; handler: Handler<T, any>; priority?: number}): Promise<any> {
    const {filter, handler} = obj;
    return new Promise(resolve => {
      if (typeof(this.data[filter.baseKey]) === 'undefined') {
        this.data[filter.baseKey] = {};
      }
      this.data[filter.baseKey][handler.key] = {
        priority: obj.priority || 10,
        handler: handler
      };
      return resolve();
    });
  }


}