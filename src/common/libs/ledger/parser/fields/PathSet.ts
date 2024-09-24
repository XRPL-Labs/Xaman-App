import { Path } from '@common/libs/ledger/types/common';

/* Field ==================================================================== */
export const PathSet = {
    getter: (self: any, name: string) => {
        return (): Path[] => {
            return self[name];
        };
    },
    setter: (self: any, name: string) => {
        return (value: Path[]): void => {
            if (typeof value === 'undefined') {
                self[name] = undefined;
                return;
            }

            if (!Array.isArray(value)) {
                throw new Error(`field ${name} required type array, got ${typeof value}`);
            }

            self[name] = value;
        };
    },
};
