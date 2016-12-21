import testCreator from './filtermodeltestcreator';
import {RedisFilterModel} from '../../src/filtermodel/redisfiltermodel.class';
import * as promisify from 'es6-promisify';
import * as redis from 'redis';
const redisClient = redis.createClient();
describe('RedisFilterModel', () => {
  testCreator(async () => new RedisFilterModel(redisClient, () => redis.createClient()));
  beforeEach(async () => {
    await promisify(redisClient.flushdb, redisClient)();
  });
  // afterEach(async () => {
  //   const keys = await promisify(redisClient.keys, redisClient)('*');
  //   console.log(keys);
  // });
});