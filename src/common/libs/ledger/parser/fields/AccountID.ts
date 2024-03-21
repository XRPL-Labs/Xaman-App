import { utils as AccountLibUtils } from 'xrpl-accountlib';

/* Field ==================================================================== */
export const AccountID = {
    getter: (self: any, name: string) => {
        return (): string => {
            return self[name];
        };
    },
    setter: (self: any, name: string) => {
        return (value: string): void => {
            if (!AccountLibUtils.isValidAddress(value)) {
                throw new Error(`provided value ${value} is not a valid accountID`);
            }
            self[name] = value;
        };
    },
};
