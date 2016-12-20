import { FilterModel } from './filter.model.interface';
import { Filter } from '../worker';
import { Handler } from '../handler/base.class';
import { RedisClient } from 'redis';
type ThenRedis = {}
const promisify = require('es6-promisify') as (...args) => (...args) => Promise<any>;
export class RedisFilterModel implements FilterModel {
  private zadd: (k: string, score: number, member: string) => Promise<string>;
  private zrange: (k: string, start: number, end: number, withscores?: string) => Promise<string[]>;

  constructor(private redisClient: RedisClient, private redisClientCreator: () => RedisClient) {
    this.zadd = promisify(redisClient.zadd, redisClient);
    this.zrange = promisify(redisClient.zrange, redisClient);
  }

  async blpop(what:string, timeout:number) {
    const redisClient = this.redisClientCreator();
    const blpop = promisify(redisClient.blpop, redisClient);
    const toRet = await blpop(what, timeout);

    redisClient.quit();
    return toRet;
  }

  async queryHandlers<T>(filter: Filter<T>): Promise<Handler<T, any>[]> {
    const handlerKeys = await this.zrange(`handlers:${filter.baseKey}`, 0, -1);
    return handlerKeys.map(handlerKey => {
      return new Handler(handlerKey, async (obj:T) => {
        const rpush = promisify(this.redisClient.rpush, this.redisClient);
        const set = promisify(this.redisClient.set, this.redisClient);
        const workID = '1';
        await set(`handlers:jobs:data:${filter.baseKey}`, JSON.stringify(obj));
        await rpush(`handlers:jobs:${filter.baseKey}:${handlerKey}`, workID);
        const res = await this.blpop(`handlers:jobs:${filter.baseKey}:${handlerKey}:${workID}:done`, 0);
        return JSON.parse(res);
      });
    });
  }

  async registerHandler<T>(obj: {filter: Filter<T>; handler: Handler<T, any>; priority?: number}): Promise<any> {
    await this.zadd(`handlers:${obj.filter.baseKey}`, obj.priority || 10, obj.handler.key);
    const oldHandler = obj.handler.handle;
    const redisClient = this.redisClientCreator();
    const bit = async() => {

      const blpop = promisify(redisClient.blpop, redisClient);
      const get = promisify(this.redisClient.get, this.redisClient);
      const set = promisify(this.redisClient.set, this.redisClient);
      const rpush = promisify(this.redisClient.rpush, this.redisClient);

      let workID = null;
      try {
        await blpop(`handlers:jobs:${obj.filter.baseKey}:${obj.handler.key}`);
      } catch (e) {
        console.log(e);
      }
      ;
      if (workID != null) {
        const data: T = JSON.parse(await get(`handlers:jobs:data:${obj.filter.baseKey}`));
        const res = await oldHandler.call(obj.handler, data);
        await rpush(`handlers:jobs:${obj.filter.baseKey}:${obj.handler.key}:${workID}:done`, JSON.stringify(res));
      }
    };

    obj.handler.unregister = async() => {
      redisClient.quit();
      return true;
    };
    bit();

    return undefined;
  }

}