import { HandlerRegistration, FilterModel } from '../filtermodel/filter.model.interface';
import { Handler } from '../handler/base.class';
import { EasyHookSystem } from './EasyHookSystem.class';
export class WordPressHookSystem {
  private localRegistrations: {[k: string]: HandlerRegistration} = {};

  constructor(model: FilterModel, private easyFilter: EasyHookSystem = new EasyHookSystem(model)) {
  }

  add_action(action: string, handler: Handler<any, any>, priority: number = 10): Promise<true> {
    return this.add('action', action, handler, priority);
  }

  do_action(action: string, payload?: any): Promise<any> {
    return this.easyFilter.do(action, payload);
  }

  add_filter(filter: string, handler: Handler<any, any>, priority: number = 10): Promise<true> {
    return this.add('filter', filter, handler, priority);
  }

  apply_filters<T, R extends T>(filter: string, payload?: T): Promise<R> {
    return this.easyFilter.map<T, R>(filter, payload);
  }

  remove_action(action: string, handler: Handler<any, any>|string, priority: number = 10): Promise<boolean> {
    return this.remove('action', action, handler, priority);
  }

  remove_filter(action: string, handler: Handler<any, any>|string, priority: number = 10): Promise<boolean> {
    return this.remove('filter', action, handler, priority);
  }

  private async add(prefix: string, action: string, handler: Handler<any, any>, priority: number): Promise<true> {
    this.localRegistrations[`${prefix}:${action}:${handler.key}:${priority}`] = await this.easyFilter.register(
      action,
      // re-wrap is necessary cause in wp the same handler can be registered on 1+ diff priorities.
      // while this library only allows one single handler key per `action`
      new Handler<any, any>(`${handler.key}_${priority}`, (obj) => {
        return handler.handle(obj);
      }),
      priority);
    return true;
  }

  private async remove(prefix: string, what: string, handler: Handler<any, any>|string, priority: number): Promise<boolean> {
    let handlerKey: string;
    if (typeof(handler) !== 'string') {
      handlerKey = handler.key;
    } else {
      handlerKey = handler;
    }

    let localRegistration = this.localRegistrations[`${prefix}:${what}:${handlerKey}:${priority}`];
    if (typeof(localRegistration) === 'undefined') {
      return false;
    }
    delete this.localRegistrations[`${prefix}:${what}:${handlerKey}:${priority}`];
    return localRegistration.unregister();
  }

}