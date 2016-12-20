import testCreator from './filtermodeltestcreator';
import {InMemoryFilterModel} from '../../src/filtermodel/inmemoryfiltermodel.class';
describe('InMemoryFilterModel', () => {
  testCreator(async () => new InMemoryFilterModel());
});