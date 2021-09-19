import * as v1 from './v1';
import * as v2 from './v2';
import * as v3 from './v3';
import * as v4 from './v4';
import * as v5 from './v5';
import * as v6 from './v6';
import * as v7 from './v7';
import * as v8 from './v8';
import * as v9 from './v9';
import * as v10 from './v10';

const schemas = [
    { schema: v1, schemaVersion: 1, migration: v1.migration },
    { schema: v2, schemaVersion: 2, migration: v2.migration },
    { schema: v3, schemaVersion: 3, migration: v3.migration },
    { schema: v4, schemaVersion: 4, migration: v4.migration },
    { schema: v5, schemaVersion: 5, migration: v5.migration },
    { schema: v6, schemaVersion: 6, migration: v6.migration },
    { schema: v7, schemaVersion: 7, migration: v7.migration },
    { schema: v8, schemaVersion: 8, migration: v8.migration },
    { schema: v9, schemaVersion: 9, migration: v9.migration },
    { schema: v10, schemaVersion: 10, migration: v10.migration },
];

export default schemas;
