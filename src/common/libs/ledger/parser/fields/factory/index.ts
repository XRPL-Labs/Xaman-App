import { assertRequired, assertTrue } from '@common/utils/assert';

import { FieldConfigGeneric } from '@common/libs/ledger/parser/fields/types';

const createPropertyConfig = (property: string, fieldConfig: FieldConfigGeneric, self: any) => {
    const { required, type, codec, readonly } = fieldConfig;

    if (typeof type?.getter !== 'function' || typeof type?.setter !== 'function') {
        throw new Error(`Getter and Setter is required for property ${property} `);
    }

    if (codec && (typeof codec?.decode !== 'function' || typeof codec?.encode !== 'function')) {
        throw new Error('property has invalid codec, make sure encode and decode method is implemented!');
    }

    const getter = () => {
        const value = type.getter(self, property)();
        if (typeof value !== 'undefined' && typeof codec?.decode === 'function') {
            return codec.decode(self, value);
        }
        return value;
    };

    const setter = (value: any) => {
        assertTrue(readonly, `${property} is readonly!`);
        assertRequired(value, !!required, `property ${property} is required!`);

        if (typeof value !== 'undefined' && typeof codec?.decode === 'function') {
            type.setter(self, property)(codec.encode(self, value));
            return;
        }
        type.setter(self, property)(value);
    };

    return {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: false,
    };
};

export { createPropertyConfig };
