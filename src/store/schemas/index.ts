import * as v1 from './v1';
import * as v2 from './v2';
import * as v3 from './v3';
import * as v4 from './v4';
import * as v5 from './v5';

const schemas = [
    { schema: v1, schemaVersion: 1, migration: v1.migration },
    { schema: v2, schemaVersion: 2, migration: v2.migration },
    { schema: v3, schemaVersion: 3, migration: v3.migration },
    { schema: v4, schemaVersion: 4, migration: v4.migration },
    { schema: v5, schemaVersion: 5, migration: v5.migration },
];

export default schemas;
