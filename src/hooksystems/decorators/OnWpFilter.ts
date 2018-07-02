import { WordPressHookSystem } from '../WordpressHookSystem';
import { IWPHookSubscriber } from './WpHookSubscriber';

/**
 * Method decorator to register a filter within the class
 * @param {() => WordPressHookSystem} hookGetter
 * @param {string} filter filtername
 * @param {number} priority priority for the filter (defaults to 10)
 */
// tslint:disable-next-line max-line-length
export function OnWPFilter<T extends IWPHookSubscriber>(hookGetter: () => WordPressHookSystem, filter: string, priority: number = 10) {
  return (target: T,
          method: string,
          descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) => {
    target.__wpFilterListeners = target.__wpFilterListeners || [];
    target.__wpFilterListeners.push({method, filter, hookGetter, priority});
    return descriptor;
  };
}
