/* eslint-disable spellcheck/spell-checker */

import Realm from 'realm';

import BaseRepository from '../../repositories/base';

// Helpers
const generatedIds = Array.from(Array(10).keys());
function generateRandomData() {
    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomId = () => {
        let id;
        while (true) {
            id = Math.floor(Math.random() * 1000);
            if (!generatedIds.includes(id)) {
                break;
            }
        }
        generatedIds.push(id);
        return id;
    };
    const getRandomString = (length: number) => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    return {
        id: getRandomId(),
        name: getRandomString(10),
        isActive: Math.random() < 0.5,
        age: getRandomInt(18, 99),
    };
}

describe('BaseRepository', () => {
    let repo: BaseRepository<any>;
    let model: any;
    let instance: any;
    let data: any;

    beforeAll(() => {
        jest.useFakeTimers();

        repo = new BaseRepository();
        model = class SampleModel extends Realm.Object<SampleModel> {
            // @ts-ignore
            public static schema: Realm.ObjectSchema = {
                name: 'SampleSchema',
                primaryKey: 'id',
                properties: {
                    id: 'int',
                    name: 'string',
                    isActive: 'bool?',
                    age: 'int?',
                },
            };
        };
        instance = new Realm({ schema: [model], path: './.jest/sampleRealmInMemory', inMemory: true });
        data = [
            { id: 1, name: 'John', isActive: false, age: 20 },
            { id: 2, name: 'Ari', isActive: true, age: 20 },
            { id: 3, name: 'Baltazar', isActive: false, age: 30 },
            { id: 4, name: 'Alice', isActive: true, age: 35 },
            { id: 5, name: 'Bob', isActive: false, age: 40 },
        ];
        repo.realm = instance;
        // populate
        repo.realm.write(() => {
            data.forEach((d: any) => {
                repo.realm.create(model, d, Realm.UpdateMode.All);
            });
        });
        repo.model = model;
    });

    describe('normalizeQuery', () => {
        it('should return the same string if query is a string', () => {
            expect(repo.normalizeQuery('name == "John"')).toBe('name == "John"');
        });

        it('should convert a valid query object to a string', () => {
            const queryObject = {
                name: 'John',
                isActive: true,
                age: 30,
            };
            expect(repo.normalizeQuery(queryObject)).toBe('name == "John" AND isActive == "true" AND age == "30"');
        });

        it('should throw an error for unrecognized value set', () => {
            const invalidQueryObject = {
                name: {},
            };
            expect(() => repo.normalizeQuery(invalidQueryObject)).toThrowError(
                /Unrecognized value set for query param/,
            );
        });

        it('should throw an error for unrecognized query field names', () => {
            const unrecognizedQueryObject = {
                name: 'John',
                unknownField: 'value',
            };
            expect(() => repo.normalizeQuery(unrecognizedQueryObject)).toThrowError(/Unrecognized query field names/);
        });
    });

    describe('safeWrite', () => {
        let mockIsInTransaction: jest.SpyInstance;
        let mockWrite: jest.SpyInstance;
        let setTimeoutSpy: jest.SpyInstance;

        beforeEach(() => {
            mockIsInTransaction = jest.spyOn(repo.realm, 'isInTransaction', 'get');
            mockWrite = jest.spyOn(repo.realm, 'write');
            setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        });

        afterEach(() => {
            mockIsInTransaction.mockRestore();
            mockWrite.mockRestore();
            setTimeoutSpy.mockRestore();
        });

        it('should directly call the write method if realm is not in transaction', () => {
            mockIsInTransaction.mockReturnValue(false);

            const mockFunction = jest.fn();
            repo.safeWrite(mockFunction);

            expect(mockWrite).toHaveBeenCalledWith(mockFunction);
            expect(mockFunction).toHaveBeenCalled();
        });

        it('should wait until realm is not in transaction to call the write method', () => {
            // eslint-disable-next-line max-len
            mockIsInTransaction.mockReturnValueOnce(true).mockReturnValue(false);

            const mockFunction = jest.fn();
            repo.safeWrite(mockFunction);

            expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
            jest.runAllTimers();

            expect(mockWrite).toHaveBeenCalledWith(mockFunction);
            expect(mockFunction).toHaveBeenCalled();
        });
    });

    describe('count', () => {
        it('should return count of all objects', () => {
            const spyObjects = jest.spyOn(repo.realm, 'objects');
            expect(repo.count()).toEqual(data.length);
            expect(spyObjects).toBeCalledWith(model);
            spyObjects.mockClear();
        });
    });

    describe('findAll', () => {
        it('should return all objects', () => {
            const spyObjects = jest.spyOn(repo.realm, 'objects');
            expect(repo.findAll().toJSON()).toStrictEqual(data);
            expect(spyObjects).toBeCalledWith(model);
            spyObjects.mockClear();
        });
    });

    describe('findOne', () => {
        it('should return undefined if no results are found', () => {
            expect(repo.findOne('name == "Jacob"')).toBeUndefined();
        });

        it('should return a single result if one match is found', () => {
            expect(repo.findOne('name == "Alice"').toJSON()).toMatchObject(data.find((d: any) => d.name === 'Alice'));
        });

        it('should throw an error if multiple matches are found', () => {
            expect(() => repo.findOne('age == "20"')).toThrow('Got more than one result');
        });
    });

    describe('query', () => {
        let objectsSpy: jest.SpyInstance;
        let normalizeQuerySpy: jest.SpyInstance;

        beforeEach(() => {
            objectsSpy = jest.spyOn(repo.realm, 'objects');
            normalizeQuerySpy = jest.spyOn(repo, 'normalizeQuery');
        });

        it('should call realm.objects and filtered with correct arguments for string query', () => {
            const testQuery = 'name == "John"';
            repo.query(testQuery);

            expect(objectsSpy).toHaveBeenCalledWith(model);
            expect(normalizeQuerySpy).toHaveBeenCalledWith(testQuery);
        });

        it('should call realm.objects and filtered with correct arguments for object query', () => {
            const testQuery = { name: 'John' };
            repo.query(testQuery);

            expect(objectsSpy).toHaveBeenCalledWith(model);
            expect(normalizeQuerySpy).toHaveBeenCalledWith(testQuery);
        });

        afterEach(() => {
            objectsSpy.mockRestore();
            normalizeQuerySpy.mockRestore();
        });
    });

    describe('upsert', () => {
        it('should throw an error if data does not contain an id', async () => {
            await expect(repo.upsert({ name: 'John' })).rejects.toThrow('id require primary key to be set');
        });

        it('should use UpdateMode.All if object exists', async () => {
            const realmCreateSpy = jest.spyOn(repo.realm, 'create');
            await repo.upsert(data[0]);
            expect(realmCreateSpy).toHaveBeenCalledWith(model, data[0], Realm.UpdateMode.All);
        });

        it('should use UpdateMode.Never if object does not exist', async () => {
            const sampleData = generateRandomData();
            const realmCreateSpy = jest.spyOn(repo.realm, 'create');
            await repo.upsert(sampleData);
            expect(realmCreateSpy).toHaveBeenCalledWith(model, sampleData, Realm.UpdateMode.Never);
        });

        it('should reject the promise if there is an error in safeWrite', async () => {
            const sampleData = generateRandomData();
            const error = new Error('Some unexpected error');
            const safeWriteSpy = jest.spyOn(repo, 'safeWrite').mockImplementation(() => {
                throw error;
            });
            await expect(repo.upsert(sampleData)).rejects.toEqual(error);
            safeWriteSpy.mockRestore();
        });
    });

    describe('create', () => {
        it('should resolve with the created object', async () => {
            const mockData = generateRandomData();
            await expect(repo.create(mockData)).resolves.toEqual(mockData);
        });

        it('should call realm.create with UpdateMode.All when update is true', async () => {
            const createSpy = jest.spyOn(repo.realm, 'create');
            const mockData = generateRandomData();
            await repo.create(mockData, true);
            expect(createSpy).toHaveBeenCalledWith(model, mockData, Realm.UpdateMode.All);
            createSpy.mockClear();
        });

        it('should call realm.create with UpdateMode.Never when update is false or undefined', async () => {
            const createSpy = jest.spyOn(repo.realm, 'create');
            const mockData1 = generateRandomData();
            await repo.create(mockData1);
            expect(createSpy).toHaveBeenCalledWith(model, mockData1, Realm.UpdateMode.Never);
            const mockData2 = generateRandomData();
            await repo.create(mockData2, false);
            expect(createSpy).toHaveBeenCalledWith(model, mockData2, Realm.UpdateMode.Never);
            createSpy.mockClear();
        });
    });

    describe('createList', () => {
        it('should return the dataList if no errors are thrown', () => {
            const mockDataList = Array.from(Array(5), generateRandomData);
            const result = repo.createList(mockDataList);
            expect(result).toBe(mockDataList);
        });

        it('should call realm.create with UpdateMode.All when update is true', async () => {
            const createSpy = jest.spyOn(repo.realm, 'create');
            const mockDataList = Array.from(Array(3), generateRandomData);
            await repo.createList(mockDataList, true);
            expect(createSpy).toHaveBeenCalledTimes(3);
            mockDataList.forEach((d) => {
                expect(createSpy).toHaveBeenCalledWith(model, d, Realm.UpdateMode.All);
            });
            createSpy.mockClear();
        });

        it('should call realm.create with UpdateMode.Never when update is false or undefined', async () => {
            const createSpy = jest.spyOn(repo.realm, 'create');
            const mockDataList1 = Array.from(Array(3), generateRandomData);
            await repo.createList(mockDataList1);
            expect(createSpy).toHaveBeenCalledTimes(3);
            mockDataList1.forEach((d) => {
                expect(createSpy).toHaveBeenCalledWith(model, d, Realm.UpdateMode.Never);
            });
            createSpy.mockClear();
        });
    });

    describe('deleteById', () => {
        it('should call this.delete with the found item if an item is found', async () => {
            const objectForPrimaryKeySpy = jest.spyOn(repo.realm, 'objectForPrimaryKey');
            const deleteSpy = jest.spyOn(repo, 'delete');

            const item = generateRandomData();
            await expect(repo.create(item)).resolves.toEqual(item);
            await repo.deleteById(item.id);

            expect(objectForPrimaryKeySpy).toHaveBeenCalledWith(model, item.id);
            expect(deleteSpy).toHaveBeenCalledTimes(1);

            objectForPrimaryKeySpy.mockClear();
            deleteSpy.mockClear();
        });

        it('should throw an "Item not found!" error if no item is found', async () => {
            const objectForPrimaryKeySpy = jest.spyOn(repo.realm, 'objectForPrimaryKey');
            const deleteSpy = jest.spyOn(repo, 'delete');

            await expect(repo.deleteById(999999)).rejects.toThrow('Item not found!');
            expect(objectForPrimaryKeySpy).toHaveBeenCalledWith(model, 999999);
            expect(deleteSpy).not.toHaveBeenCalled();

            objectForPrimaryKeySpy.mockClear();
            deleteSpy.mockClear();
        });
    });

    describe('delete', () => {
        it('should call safeWrite and realm.delete with the provided object and resolve the promise', async () => {
            const realmDeleteSpy = jest.spyOn(repo.realm, 'delete');
            const safeWriteSpy = jest.spyOn(repo, 'safeWrite');

            const item = generateRandomData();
            const createdItem = await repo.create(item);

            await expect(repo.delete(createdItem)).resolves.toBeUndefined();
            expect(safeWriteSpy).toHaveBeenCalled();
            expect(realmDeleteSpy).toHaveBeenCalledTimes(1);

            realmDeleteSpy.mockClear();
            safeWriteSpy.mockRestore();
        });

        it('should reject the promise and handle error properly if an error occurs during deletion', async () => {
            const realmDeleteSpy = jest.spyOn(repo.realm, 'delete');

            const objectMock = { id: 1 };
            const errorMock = new Error('Deletion error');
            const safeWriteSpy = jest.spyOn(repo, 'safeWrite').mockImplementation(() => {
                throw errorMock;
            });
            // @ts-ignore
            await expect(repo.delete(objectMock)).rejects.toThrow(errorMock);
            expect(repo.safeWrite).toHaveBeenCalled();
            expect(realmDeleteSpy).not.toHaveBeenCalled();
            safeWriteSpy.mockRestore();
        });
    });

    describe('deleteAll', () => {
        it('should call safeWrite and realm.delete with the found items and return true if items are found', () => {
            const findAllSpy = jest.spyOn(repo, 'findAll');
            const safeWriteSpy = jest.spyOn(repo, 'safeWrite');
            const realmDeleteSpy = jest.spyOn(repo.realm, 'delete');

            const items = repo.findAll();
            const result = repo.deleteAll();

            expect(findAllSpy).toHaveBeenCalled();
            expect(safeWriteSpy).toHaveBeenCalled();
            expect(realmDeleteSpy.mock.calls[0][0]).toHaveLength(items.length);
            expect(result).toBe(true);

            findAllSpy.mockClear();
            safeWriteSpy.mockClear();
            realmDeleteSpy.mockClear();
        });

        it('should not call safeWrite and realm.delete and still return true if no items are found', () => {
            const safeWriteSpy = jest.spyOn(repo, 'safeWrite');
            const realmDeleteSpy = jest.spyOn(repo.realm, 'delete');

            // @ts-ignore
            repo.findAll = jest.fn(() => []);
            const result = repo.deleteAll();

            expect(repo.findAll).toHaveBeenCalled();
            expect(safeWriteSpy).not.toHaveBeenCalled();
            expect(realmDeleteSpy).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        instance.close();
        Realm.deleteFile({ path: './.jest/sampleRealmInMemory' });
    });
});
