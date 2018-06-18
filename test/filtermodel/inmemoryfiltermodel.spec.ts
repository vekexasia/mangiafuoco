import { InMemoryFilterModel } from '../../src/filtermodel/';
import testCreator from './filtermodeltestcreator';

describe('InMemoryFilterModel', () => {
  testCreator(async () => new InMemoryFilterModel());
});
