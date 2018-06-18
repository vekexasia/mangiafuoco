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

  public do_action(action: string, payload?: any): Promise<any> {
    return this.easyFilter.do(`action_${action}`, payload);
  }

  public add_filter(filter: string, handler: Handler<any, any>, priority: number = 10): Promise<true> {
    return this.add('filter', filter, handler, priority);
  }

  public apply_filters<T, R extends T>(filter: string, payload?: T): Promise<R> {
    return this.easyFilter.map<T, R>(`filter_${filter}`, payload);
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
      new Handler<any, any>(`${handler.key}_${priority}`, (obj) => {
        return handler.handle(obj);
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

/**
 * Method decorator for actions.
 */
export function WPAction<T>(hookSystem: () => WordPressHookSystem, action?: string) {
  return (target: T,
          method: string,
          descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) => {
    const oldValue = descriptor.value;

    const preName = `${target.constructor.name}.pre.${action || method}`;
    const postName = `${target.constructor.name}.post.${action || method}`;
    descriptor.value = async function decorateAction(...args: any[]) {
      await hookSystem().do_action(preName, args);
      const toRet = await oldValue.apply(this, args);
      await hookSystem().do_action(postName, args);
      return toRet;
    };
    return descriptor;
  };
}

/**
 * Method decorator for filters.
 */
export function WPFilter<T>(hookSystem: () => WordPressHookSystem, action?: string) {
  return (target: T,
          method: string,
          descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) => {
    const oldValue = descriptor.value;

    const postName = `${target.constructor.name}.post.${action || method}`;
    descriptor.value = async function decorateFilter(...args: any[]) {
      const toRet = await oldValue.apply(this, args);
      return await hookSystem().apply_filters(postName, toRet);
    };
    return descriptor;
  };
}
