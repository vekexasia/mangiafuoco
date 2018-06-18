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

  public async series<R extends T>(obj: T): Promise<R> {
    const queryHandlers = await this.model.queryHandlers(this);
    let toRet           = obj;
    for (const queryHandler of queryHandlers) {
      toRet = await queryHandler.handle(toRet);
    }
    return toRet as R;
  }

  public async parallel<R extends T>(obj: T): Promise<R[]> {
    const queryHandlers = await this.model.queryHandlers(this);
    return Promise.all<R>(queryHandlers
      .map((handler) => handler.handle(obj))
    );
  }

}
