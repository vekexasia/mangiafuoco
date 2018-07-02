import { IFilterModel, IHandlerRegistration } from '../filtermodel';
import { Handler } from '../handler';

export class BaseHookSystem<T> {
  public constructor(public baseKey: string, private model: IFilterModel) {
  }

  public addHandler(obj: { handler: Handler<T, any>, priority?: number }): Promise<IHandlerRegistration> {
    return this.model.registerHandler({
      handler   : obj.handler,
      hookSystem: this,
      priority  : obj.priority,
    });
  }

  public async seriesMap<R extends T>(obj: T, ...rest: any[]): Promise<R> {
    const queryHandlers = await this.model.queryHandlers(this);
    let toRet           = obj;
    for (const queryHandler of queryHandlers) {
      toRet = await queryHandler.handle(toRet, ...rest);
    }
    return toRet as R;
  }

  public async series(obj: any, ...rest: any[]): Promise<void> {
    const queryHandlers = await this.model.queryHandlers(this);
    for (const queryHandler of queryHandlers) {
      await queryHandler.handle(obj, ...rest);
    }
  }

  public async parallel<R extends T>(obj: T, ...rest: any[]): Promise<R[]> {
    const queryHandlers = await this.model.queryHandlers(this);
    return Promise.all<R>(queryHandlers
      .map((handler) => handler.handle(obj, ...rest))
    );
  }

}
