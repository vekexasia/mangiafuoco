import { WordPressHookSystem } from '../WordpressHookSystem';
import { MethodDecorator } from './methodDecorator';
import { IWPHookSubscriber } from './WpHookSubscriber';

/**
 * Method decorator to register a filter within the class
 * @param {() => WordPressHookSystem} hookGetter
 * @param {string} filter filtername
 * @param {number} priority priority for the filter (defaults to 10)
 */
// tslint:disable max-line-length
export function OnWPFilter<T extends IWPHookSubscriber, K = (...args: any[]) => Promise<any>>(hookGetter: () => WordPressHookSystem, filter: string, priority?: number): MethodDecorator<T, K>;
export function OnWPFilter<T extends IWPHookSubscriber & { hookSystem: WordPressHookSystem }, K = (...args: any[]) => Promise<any>>(filter: string, priority?: number): MethodDecorator<T, K>;
export function OnWPFilter<T extends IWPHookSubscriber, K = (...args: any[]) => Promise<any>>(hookGetter: string | (() => WordPressHookSystem), filter: string | number, priority: number = 10): MethodDecorator<T, K> {
  if (typeof(hookGetter) === 'string') {
    if (typeof (filter) === 'number') {
      priority = filter;
    }
    filter     = hookGetter;
    hookGetter = null as () => WordPressHookSystem;
  }
  return (target: T,
          method: string,
          descriptor: TypedPropertyDescriptor<K>) => {
    target.__wpFilterListeners = target.__wpFilterListeners || [];
    target.__wpFilterListeners.push({ method, filter: filter as string, hookGetter: hookGetter as any, priority });
    return descriptor;
  };
}
