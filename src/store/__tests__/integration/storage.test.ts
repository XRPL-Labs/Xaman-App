import { sortBy } from 'lodash';
import DataStorage from '../../storage';

let storage: DataStorage;

describe('Storage', () => {
    describe('Integration', () => {
        beforeAll(() => {
            storage = new DataStorage();
        });

        it('should initialize properly', async () => {
            const sorted = sortBy(require('../../models/schemas').default, [(v) => v.schemaVersion]);
            const latest = sorted.slice(-1)[0];

            const spy = jest.spyOn(latest, 'populate');

            // initialize the storage
            await storage.initialize();

            expect(storage.dataStore).toBeDefined();
            // should have latest schema version
            expect(storage.dataStore.schemaVersion).toBe(latest.schemaVersion);

            // should have been called the populate method
            expect(spy).toBeCalled();

            spy.mockRestore();
        });

        afterAll(() => {
            DataStorage.wipe();
            storage.close();
        });
    });
});
