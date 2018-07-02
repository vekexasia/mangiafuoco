import { IFilterModel, IHandlerRegistration } from '../filtermodel';
import { Handler } from '../handler';
import { BaseHookSystem } from './BaseHookSystem';

export class EasyHookSystem {

  private hooksRegistry: {[k: string]: BaseHookSystem<any>} = {};

  public constructor(private model: IFilterModel) {
  }

  // tslint:disable-next-line max-line-length
  public async register<T>(eventName: string, handler: Handler<T, any>, priority: number = 10): Promise<IHandlerRegistration> {
    return this.getFilter(eventName)
      .addHandler({handler, priority});
  }

  public async series<T>(eventName: string, payload?: T, ...rest: any[]) {
    return this.getFilter(eventName)
      .series(payload, ...rest);
  }

  /**
   * emits the event to all handlers parallelly and returns the results generated by each one of them
   * Note that result array is ordered as handlers priority.
   * @param eventName the event Name Ex: user_purchase
   * @param [payload=null] the payload that might be used by handlers. Ex: { amount: 100 }
   * @returns {Promise<T[]>}
   */
  public async do<T>(eventName: string, payload?: T, ...rest: any[]) {
    return this.getFilter(eventName)
      .parallel(payload, ...rest);
  }

  /**
   * sequentially send event out to handlers and returns last handler result
   * @param eventName the event Name Ex: validate_email
   * @param [payload=null] the payload sent to first handler: Ex: 'me@andreabaccega.com'
   * @returns {Promise<T>|Promise<R>}
   */
  public async map<T>(eventName: string, payload?: T, ...rest: any[]): Promise<T>;
  public async map<T, R extends T>(eventName: string, payload?: T, ...rest: any[]): Promise<R>;
  public async map<T>(eventName: string, payload?: T, ...rest: any[]) {
    return this.getFilter(eventName)
      .seriesMap(payload, ...rest);
  }
  /**
   * emits the event to all handlers parallelly but does not wait for the handlers
   * to complete their execution.
   * @param eventName
   * @param payload
   * @returns {boolean}
   */
  public enqueueDo<T>(eventName: string, payload?: T): true {
    setImmediate(async () => {
      await this.do(eventName, payload);
    });
    return true;
  }

  private getFilter<T>(eventName: string): BaseHookSystem<T> {
    if (typeof(this.hooksRegistry[eventName]) === 'undefined') {
      this.hooksRegistry[eventName] = new BaseHookSystem<T>(eventName, this.model);
    }
    return this.hooksRegistry[eventName];
  }

}
