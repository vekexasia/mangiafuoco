import * as promisify from 'es6-promisify';
import { RedisClient } from 'redis';
import { Handler } from '../handler';
import { BaseHookSystem } from '../hooksystems';
import { IFilterModel, IHandlerRegistration } from './filtermodel';

export class RedisFilterModel implements IFilterModel {
  private zadd: (k: string, score: number, member: string) => Promise<string>;
  private zrange: (k: string, start: number, end: number, withscores?: string) => Promise<string[]>;
  private incr: (k: string) => Promise<string>;

  constructor(private redisClient: RedisClient, private redisClientCreator: () => RedisClient) {
    this.zadd   = promisify(redisClient.zadd, redisClient);
    this.zrange = promisify(redisClient.zrange, redisClient);
    this.incr   = promisify(redisClient.incr, redisClient);
  }

  public async queryHandlers<T>(filter: BaseHookSystem<T>): Promise<Array<Handler<T, any>>> {
    const handlerKeys = await this.zrange(`handlers:${filter.baseKey}`, 0, -1);
    return handlerKeys
      .map((handlerKey) => {
        return new Handler(handlerKey, async (obj: T) => {
          const rpush  = promisify(this.redisClient.rpush, this.redisClient);
          const workID = await this.incr('handlers:work:id');

          const workDefinition = JSON.stringify({w: workID, d: obj});
          await rpush(`handlers:jobs:${filter.baseKey}:${handlerKey}`, workDefinition);
          const processing = await this.blpop(`handlers:jobs:${filter.baseKey}:${handlerKey}:${workID}:processing`, 1);
          if (processing == null) {
            // unprocessed. // remove key
            const lrem = promisify(this.redisClient.lrem, this.redisClient);

            await lrem(`handlers:jobs:${filter.baseKey}:${handlerKey}`, 1, workDefinition);
            return obj;
          }
          const res = await this.blpop(`handlers:jobs:${filter.baseKey}:${handlerKey}:${workID}:done`, 0);
          return JSON.parse(res[1]);
        });
      });
  }

  // tslint:disable-next-line
  public async registerHandler<T>(obj: { hookSystem: BaseHookSystem<T>; handler: Handler<T, any>; priority?: number }): Promise<IHandlerRegistration> {
    const [, theID] = await Promise.all(
      [
        this.zadd(`handlers:${obj.hookSystem.baseKey}`, obj.priority || 10, obj.handler.key),
        this.incr('handlers:id'),
      ]
    );

    const oldHandler     = obj.handler.handle;
    const redisClient    = this.redisClientCreator();
    const blpop          = promisify(redisClient.blpop, redisClient);
    const rpush          = promisify(this.redisClient.rpush, this.redisClient);
    const zrem           = promisify(this.redisClient.zrem, this.redisClient);
    const unsubscribeKey = `handlers:unsubscribe:${obj.hookSystem.baseKey}:${obj.handler.key}:${theID}`;

    let registered = true;

    const bit = async () => {
      while (registered) {
        const [list, workTicket] = await blpop(
          unsubscribeKey,
          `handlers:jobs:${obj.hookSystem.baseKey}:${obj.handler.key}`
          , 0);
        if (list === unsubscribeKey) {
          await zrem(`handlers:${obj.hookSystem.baseKey}`, obj.handler.key);
          await rpush(unsubscribeKey, 'OK');
        } else if (workTicket != null) {
          // get data
          const {w: workID, d: data} = JSON.parse(workTicket) as { w: number, d: T };

          // notify that we're processing
          await rpush(`handlers:jobs:${obj.hookSystem.baseKey}:${obj.handler.key}:${workID}:processing`, workID);

          //
          const res = await oldHandler.call(obj.handler, data);
          await rpush(`handlers:jobs:${obj.hookSystem.baseKey}:${obj.handler.key}:${workID}:done`, JSON.stringify(res));
        }
      }
    };

    bit();

    return {
      id: theID,
      async unregister() {
        if (!registered) {
          return true;
        }
        registered = false;
        await rpush(unsubscribeKey, '1');
        try {
          await blpop(unsubscribeKey, 2);
        } catch (e) {
          // connection already removed probably unregistered
          // received same disconnect request generated from unregister. (AKA Already unregistered but still connected)
          // await zrem(`handlers:${obj.filter.baseKey}`, obj.handler.key);
        }
        redisClient.quit();
        return true;
      },
    };
  }

  private async blpop(what: string, timeout: number) {
    const redisClient = this.redisClientCreator();
    const blpop       = promisify(redisClient.blpop, redisClient);
    const toRet       = await blpop(what, timeout);

    redisClient.quit();
    return toRet;
  }

}
