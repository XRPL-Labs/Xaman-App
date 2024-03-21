/**
 * Base Ledger Object
 */

import { LedgerEntry } from '@common/libs/ledger/types/ledger';

import { LedgerEntryType, UInt32 } from '@common/libs/ledger/parser/fields';
import { Flags } from '@common/libs/ledger/parser/fields/codec';
import { createPropertyConfig } from '@common/libs/ledger/parser/fields/factory';

/* Types ==================================================================== */
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { InstanceTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class BaseLedgerObject<T extends LedgerEntry> {
    public static InstanceType = InstanceTypes.LedgerObject as const;
    public readonly InstanceType = BaseLedgerObject.InstanceType;

    protected _object: T;

    // abstract
    public static Fields: { [key: string]: FieldConfig } = {};

    // common fields
    public static CommonFields: { [key: string]: FieldConfig } = {
        LedgerEntryType: { type: LedgerEntryType },
        Flags: { type: UInt32, codec: Flags },
    };

    declare LedgerEntryType: FieldReturnType<typeof LedgerEntryType>;
    declare Flags?: FieldReturnType<typeof UInt32, typeof Flags>;

    constructor(object: T) {
        this._object = object;

        const fields = {
            ...(this.constructor as typeof BaseLedgerObject).Fields,
            ...BaseLedgerObject.CommonFields,
        };

        for (const property of Object.keys(fields)) {
            // get the property config
            const fieldConfig = createPropertyConfig(property, { ...fields[property] }, this._object);
            // define the property
            Object.defineProperty(this, property, fieldConfig);
        }
    }

    get Date(): string | undefined {
        return undefined;
    }

    get Index(): string {
        return this._object.index;
    }
}

/* Export ==================================================================== */
export default BaseLedgerObject;
