import StorageBackend from '../../storage';

// TODO: add migration tests

let storage: StorageBackend;

describe('Storage', () => {
    describe('Integration', () => {
        beforeAll(() => {
            const path = '.jest/cache/INTEGRATION_TEST.realm';
            storage = new StorageBackend(path);
        });

        it('should initialize properly', async () => {
            await storage.initialize();
            expect(storage.db).toBeDefined();
        });

        afterAll(() => {
            storage.purge();
            storage.close();
        });
    });
});
