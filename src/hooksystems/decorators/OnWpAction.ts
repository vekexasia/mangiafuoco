import { WordPressHookSystem } from '../WordpressHookSystem';
import { MethodDecorator } from './methodDecorator';
import { IWPHookSubscriber } from './WpHookSubscriber';

/**
 * Method decorator to register an action within the class
 * @param {() => WordPressHookSystem} hookGetter
 * @param {string} action the action name
 * @param {number} priority the priority of such action. Defaults to 10
 */
// tslint:disable max-line-length
export function OnWPAction<T extends IWPHookSubscriber, K = (...args: any[]) => Promise<any>>(hookGetter: () => WordPressHookSystem, action: string, priority?: number): MethodDecorator<T, K>;
export function OnWPAction<T extends IWPHookSubscriber & { hookSystem: WordPressHookSystem }, K = (...args: any[]) => Promise<any>>(action: string, priority?: number): MethodDecorator<T, K>;
export function OnWPAction<T extends IWPHookSubscriber, K = (...args: any[]) => Promise<any>>(hookGetter: string | (() => WordPressHookSystem), action: string | number, priority: number = 10): MethodDecorator<T, K> {
  if (typeof(hookGetter) === 'string') {
    if (typeof (action) === 'number') {
      priority = action;
    }
    action     = hookGetter;
    hookGetter = null as () => WordPressHookSystem;
  }
  return (target: T,
          method: string,
          descriptor: TypedPropertyDescriptor<K>) => {
    target.__wpActionListeners = target.__wpActionListeners || [];
    target.__wpActionListeners.push({ method, action: action as string, hookGetter: hookGetter as any, priority });
    return descriptor;
  };
}
