import StorageBackend from '../../storage';

// TODO: add migration tests

let storage: StorageBackend;

describe('Storage', () => {
    describe('Integration', () => {
        beforeAll(() => {
            storage = new StorageBackend();
        });

        it('should initialize properly', async () => {
            await storage.initialize();
            expect(storage.dataStore).toBeDefined();
        });

        afterAll(() => {
            StorageBackend.wipe();
            storage.close();
        });
    });
});
