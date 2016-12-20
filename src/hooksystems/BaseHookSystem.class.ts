import { FilterModel, HandlerRegistration } from '../filtermodel/filter.model.interface';
import { Handler } from '../handler/base.class';
export class BaseHookSystem<T> {
  constructor(public baseKey: string, private model: FilterModel) {
  }

  addHandler(obj: {handler: Handler<T,any>, priority?: number}): Promise<HandlerRegistration> {
    return this.model.registerHandler({
      filter: this,
      handler: obj.handler,
      priority: obj.priority,
    });
  }

  async process<R extends T>(obj: T): Promise<R> {
    const queryHandlers = await this.model.queryHandlers(this);
    let toRet = obj;
    for (let i = 0; i < queryHandlers.length; i++) {
      let h: Handler<T,R> = queryHandlers[i];
      toRet = await h.handle(toRet);
    }
    return toRet as R;
  }

  async processParallel<R extends T>(obj:T): Promise<R[]> {
    const queryHandlers = await this.model.queryHandlers(this);
    return Promise.all<R>(queryHandlers.map(h => h.handle(obj)));
  }

}