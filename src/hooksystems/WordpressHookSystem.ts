import { IFilterModel, IHandlerRegistration } from '../filtermodel';
import { Handler } from '../handler';
import { EasyHookSystem } from './EasyHookSystem';

export class WordPressHookSystem {
  private localRegistrations: { [k: string]: IHandlerRegistration } = {};

  public constructor(model: IFilterModel, private easyFilter: EasyHookSystem = new EasyHookSystem(model)) {
  }

  public add_action(action: string, handler: Handler<any, any>, priority: number = 10): Promise<true> {
    return this.add('action', action, handler, priority);
  }

  public do_action(action: string, payload?: any, ...args: any[]): Promise<any> {
    return this.easyFilter.series(`action_${action}`, payload, ...args);
  }

  public do_action_parallel(action: string, payload?: any, ...args: any[]): Promise<any> {
    return this.easyFilter.do(`action_${action}`, payload, ...args);
  }

  public add_filter(filter: string, handler: Handler<any, any>, priority: number = 10): Promise<true> {
    return this.add('filter', filter, handler, priority);
  }

  public apply_filters<T, R extends T>(filter: string, payload?: T, ...args: any[]): Promise<R> {
    return this.easyFilter.map<T, R>(`filter_${filter}`, payload, ...args);
  }

  public remove_action(action: string, handler: Handler<any, any> | string, priority: number = 10): Promise<boolean> {
    return this.remove('action', action, handler, priority);
  }

  public remove_filter(action: string, handler: Handler<any, any> | string, priority: number = 10): Promise<boolean> {
    return this.remove('filter', action, handler, priority);
  }

  private async add(prefix: string, action: string, handler: Handler<any, any>, priority: number): Promise<true> {
    this.localRegistrations[`${prefix}:${action}:${handler.key}:${priority}`] = await this.easyFilter.register(
      `${prefix}_${action}`,
      // re-wrap is necessary cause in wp the same handler can be registered on 1+ diff priorities.
      // while this library only allows one single handler key per `action`
      new Handler<any, any>(`${handler.key}_${priority}`, (obj, ...rest) => {
        return handler.handle(obj, ...rest);
      }),
      priority);
    return true;
  }

  // tslint:disable-next-line max-line-length
  private async remove(prefix: string, what: string, handler: Handler<any, any> | string, priority: number): Promise<boolean> {
    let handlerKey: string;
    if (typeof(handler) !== 'string') {
      handlerKey = handler.key;
    } else {
      handlerKey = handler;
    }

    const localRegistration = this.localRegistrations[`${prefix}:${what}:${handlerKey}:${priority}`];
    if (typeof(localRegistration) === 'undefined') {
      return false;
    }
    delete this.localRegistrations[`${prefix}:${what}:${handlerKey}:${priority}`];
    return localRegistration.unregister();
  }

}
