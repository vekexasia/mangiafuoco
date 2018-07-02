import { WordPressHookSystem } from '../WordpressHookSystem';
import { IWPHookSubscriber } from './WpHookSubscriber';

/**
 * Method decorator to register an action within the class
 * @param {() => WordPressHookSystem} hookGetter
 * @param {string} action the action name
 * @param {number} priority the priority of such action. Defaults to 10
 */
// tslint:disable-next-line max-line-length
export function OnWPAction<T extends IWPHookSubscriber>(hookGetter: () => WordPressHookSystem, action: string, priority: number = 10) {
  return (target: T,
          method: string,
          descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) => {
    target.__wpActionListeners = target.__wpActionListeners || [];
    target.__wpActionListeners.push({method, action, hookGetter, priority});
    return descriptor;
  };
}
