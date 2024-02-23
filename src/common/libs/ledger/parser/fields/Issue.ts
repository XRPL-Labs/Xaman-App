import { IssueType } from '@common/libs/ledger/parser/types';

/* Field ==================================================================== */
export const Issue = {
    getter: (self: any, name: string) => {
        return (): IssueType | undefined => {
            return self[name];
        };
    },
    setter: (self: any, name: string) => {
        return (value: IssueType): void => {
            if (typeof value === 'undefined') {
                self[name] = undefined;
                return;
            }

            self[name] = value;
        };
    },
};
