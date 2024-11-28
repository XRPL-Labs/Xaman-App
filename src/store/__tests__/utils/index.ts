import { find, flatMap } from 'lodash';
import Realm from 'realm';

const RealmTestUtils = {
    RealmPath: './.jest/realmTemp',
    EncryptionKey: new Int8Array(64),

    getAllModelItem: (instance: Realm, schemaName: string): any => {
        return instance.objects(schemaName) as any;
    },

    getFirstModelItem: (instance: Realm, schemaName: string): any => {
        return instance.objects(schemaName)[0] as any;
    },

    getSecondModelItem: (instance: Realm, schemaName: string): any => {
        return instance.objects(schemaName)[1] as any;
    },

    getSchemaWithVersion: (version: number) => {
        return find(require('../../models/schemas').default, { schemaVersion: version });
    },

    getRealmInstanceWithVersion: (version: number): Realm => {
        return new Realm({
            path: RealmTestUtils.RealmPath,
            schema: flatMap(RealmTestUtils.getSchemaWithVersion(version).schemas, 'schema'),
            encryptionKey: RealmTestUtils.EncryptionKey,
            schemaVersion: RealmTestUtils.getSchemaWithVersion(version).schemaVersion,
            onMigration: RealmTestUtils.getSchemaWithVersion(version).migration,
        });
    },

    cleanup: () => {
        Realm.deleteFile({ path: RealmTestUtils.RealmPath });
    },
};

export default RealmTestUtils;
