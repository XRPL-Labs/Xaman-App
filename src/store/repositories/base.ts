import EventEmitter from 'events';
import { has } from 'lodash';

import Realm from 'realm';

/* Repository  ==================================================================== */
export default class BaseRepository<T extends Realm.Object<any>> extends EventEmitter {
    realm: Realm;
    model: Realm.ObjectClass<T>;

    /**
     * Normalizes the query for realm objects.
     *
     * @param {string | { [key: string]: any }} query - The query to normalize.
     * @returns {string} - A normalized query string.
     */
    normalizeQuery = (query: string | { [key: string]: any }): string => {
        if (typeof query === 'string') return query;

        const queryObject = { ...query };

        const props = this.model.schema.properties;
        const queries = Object.entries(queryObject)
            .filter(([key]) => props[key])
            .map(([key, value]) => {
                // remove from query object
                delete queryObject[key];
                // @ts-expect-error
                const type = typeof props[key] === 'object' ? props[key].type : props[key];

                // check type
                if (!['string', 'boolean', 'number'].includes(typeof value)) {
                    throw new Error(
                        `Unrecognized value set for query param ${key}, expected ${type} but provided ${typeof value}`,
                    );
                }

                return type === 'bool' ? `${key} == ${value}` : `${key} == "${value}"`;
            });

        // unrecognized field names in query params
        if (Object.entries(queryObject).length > 0) {
            throw new Error(`Unrecognized query field names ${Object.keys(queryObject).join(',')}`);
        }

        // nothing to query
        if (queries.length === 0) {
            throw new Error('Cannot convert query object to string');
        }

        return queries.join(' AND ');
    };

    /**
     * Safely writes to the Realm.
     *
     * @param {Function} f - The write function to execute.
     */
    safeWrite = (f: any) => {
        if (this.realm.isInTransaction) {
            setTimeout(() => {
                this.safeWrite(f);
            }, 50);
        } else {
            this.realm.write(f);
        }
    };

    /**
     * Gets the count of objects.
     *
     * @returns {number} - Count of objects.
     */
    count = (): number => {
        return this.findAll().length;
    };

    /**
     * Finds all objects.
     *
     * @returns {Realm.Results<T>} - All objects.
     */
    findAll = (): Realm.Results<T> => {
        return this.realm.objects(this.model);
    };

    /**
     * Finds objects by a given key-value.
     *
     * @param {string} key - The key.
     * @param {string} val - The value.
     * @returns {Realm.Results<T>} - Objects found.
     */
    findBy = (key: string, val: string): Realm.Results<T> => {
        return this.findAll().filtered(`${key} == "${val}"`);
    };

    /**
     * Finds one object based on the query.
     *
     * @param {string | { [key: string]: any }} query - The query to search.
     * @returns {T} - Found object.
     * @throws will throw an error if more than one result found.
     */
    findOne = (query: string | Partial<T>): T => {
        const result = this.realm.objects(this.model).filtered(this.normalizeQuery(query));

        if (result.length === 0) {
            return undefined;
        }

        if (result.length === 1) {
            return result[0];
        }

        throw new Error('Got more than one result');
    };

    /**
     * Queries objects based on the provided query.
     *
     * @param {string | { [key: string]: any }} query - The query.
     * @returns {Realm.Results<T>} - Resulting objects.
     */
    query = (query: string | Partial<T>) => {
        return this.realm.objects(this.model).filtered(this.normalizeQuery(query));
    };

    /**
     * Inserts or updates an object.
     *
     * @param {any} data - The data to upsert.
     * @returns {Promise<T>} - The created or updated object.
     */
    upsert = async (data: Partial<T>): Promise<T> => {
        if (!has(data, 'id')) throw new Error('ID require primary key to be set');

        // @ts-ignore
        const objectExists = !!this.realm.objectForPrimaryKey(this.model, data.id);

        return new Promise((resolve, reject) => {
            try {
                this.safeWrite(() => {
                    resolve(
                        this.realm.create(
                            this.model,
                            data,
                            objectExists ? Realm.UpdateMode.All : Realm.UpdateMode.Never,
                        ),
                    );
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Creates a new object.
     *
     * @param {any} data - The data to create from.
     * @param {boolean} [update=false] - Whether to update existing data.
     * @returns {Promise<T>} - The created object.
     */
    create = (data: Partial<T>, update: boolean = false): Promise<T> => {
        return new Promise((resolve, reject) => {
            try {
                this.safeWrite(() => {
                    resolve(
                        this.realm.create(this.model, data, update ? Realm.UpdateMode.All : Realm.UpdateMode.Never),
                    );
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Creates a list of objects.
     *
     * @param {any[]} dataList - The list of data to create from.
     * @param {boolean} [update=false] - Whether to update existing data.
     * @returns {any[] | Error} - The created objects or an error.
     */
    createList = (dataList: Partial<T>[], update: boolean = false): any[] | Error => {
        try {
            this.safeWrite(() => {
                dataList.forEach((data) =>
                    this.realm.create(this.model, data, update ? Realm.UpdateMode.All : Realm.UpdateMode.Never),
                );
            });

            return dataList;
        } catch (error: any) {
            return error;
        }
    };

    /**
     * Deletes an object by a given id
     *
     * @returns {Promise<void>} - A promise.
     * @param id
     */
    deleteById = (id: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            const item = this.realm.objectForPrimaryKey(this.model, id);
            if (!item) {
                reject(new Error('Item not found!'));
                return;
            }
            this.delete(item).then(resolve).catch(reject);
        });
    };

    /**
     * Deletes an object or a set of objects.
     *
     * @param {Realm.Object | Realm.Object[] | Realm.List<any> | Realm.Results<any>} object - The object(s) to delete.
     * @returns {Promise<void>} - A promise.
     */
    delete = async (object: Realm.Object<T> | Realm.Object<T>[]): Promise<void> => {
        return new Promise((resolve, reject) => {
            try {
                this.safeWrite(() => {
                    this.realm.delete(object);
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Deletes all objects of the model.
     *
     * @returns {boolean | Error} - True if successful, error otherwise.
     */
    deleteAll = (): boolean => {
        const items = this.findAll();
        if (items.length > 0) {
            this.safeWrite(() => this.realm.delete(items));
        }
        return true;
    };
}
