import { Handler } from '../../handler';
import { WordPressHookSystem } from '../WordpressHookSystem';

// tslint:disable-next-line interface-over-type-literal
type BaseRepoInfo = {
  method: string,
  priority: number,
  hookGetter: () => WordPressHookSystem
};

type BaseActionRepoInfo = BaseRepoInfo & { action: string};
type BaseFilterRepoInfo = BaseRepoInfo & { filter: string};

type RegisteredInfo<T extends BaseRepoInfo> = T & { handler: Handler<any, any> };

export interface IWPHookSubscriber {
  /**
   * Contains all registered actions from decorators (internal use only)
   */
  __wpActionListeners: BaseActionRepoInfo[];

  /**
   * Contains all registered filters from decorators (internal use only)
   */
  __wpFilterListeners: BaseFilterRepoInfo[];

  /**
   * Initialize class with decorated methods.
   * @return {Promise<void>}
   */
  hookMethods(): Promise<void>;

  /**
   * Unregister all registered hooks
   * @return {Promise<void>}
   */
  unHook(): Promise<void>;
}

/**
 * Class decorator or mixin to add subscriber functionalities to class.
 * To be used with OnWPAction and OnWPFilter
 */
export function WPHooksSubscriber<T extends { new(...args: any[]): {} }>(constructor: T) {
  return class extends constructor implements IWPHookSubscriber {
    // tslint:disable variable-name
    public __wpActionListeners: BaseActionRepoInfo[];
    public __wpFilterListeners: BaseFilterRepoInfo[];
    public __wpuid: string;
    public _registered_actions: Array<RegisteredInfo<BaseActionRepoInfo>> = [];
    public _registered_filters: Array<RegisteredInfo<BaseFilterRepoInfo>> = [];
    // tslint:enable variable-name

    public async hookMethods() {
      if (this.__wpuid) {
        throw new Error('Hooks already bound');
      }
      this.__wpuid = (Math.floor(1e16 * Math.random())).toString(16);
      if (Array.isArray(this.__wpActionListeners)) {

        for (const a of this.__wpActionListeners) {
          const handler = new Handler(
            `${this.constructor.name}[${this.__wpuid}].action.${a.action}`,
            (...handlerArgs) => this[a.method](...handlerArgs)
          );
          await a.hookGetter().add_action(a.action, handler, a.priority);
          this._registered_actions.push({... a, handler});
        }
      }
      if (Array.isArray(this.__wpFilterListeners)) {
        for (const a of this.__wpFilterListeners) {
          const handler = new Handler(
            `${this.constructor.name}[${this.__wpuid}].filter.${a.filter}`,
            (...handlerArgs) => this[a.method](...handlerArgs)
          );
          await a.hookGetter().add_filter(a.filter, handler, a.priority);
          this._registered_filters.push({... a, handler});
        }
      }
    }

    public async unHook() {
      for (const {hookGetter, action, handler, priority} of this._registered_actions) {
        await hookGetter().remove_action(action, handler, priority);
      }
      for (const {hookGetter, filter, handler, priority} of this._registered_filters) {
        await hookGetter().remove_filter(filter, handler, priority);
      }
    }
  };
}
