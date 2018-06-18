import * as promisify from 'es6-promisify';
import * as redis from 'redis';
import { RedisFilterModel } from '../../src/filtermodel';
import testCreator from './filtermodeltestcreator';

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
