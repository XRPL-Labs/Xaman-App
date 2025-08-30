import { Remark } from '@common/libs/ledger/types/common';
import { FlagParser } from '../../common';
import { InnerObjectTypes } from '../../common/flag';

/* Codec ==================================================================== */
export const Remarks = {
    decode: (_self: any, value: { Remark: Remark }[]): Remark[] => {
        return value.map((item) => {
            const flagParser = new FlagParser(
                InnerObjectTypes.Remark,
                typeof item.Remark.Flags === 'number' ? item.Remark.Flags : undefined,
            );
            return {
                RemarkName: item.Remark.RemarkName,
                RemarkValue: item.Remark.RemarkValue,
                Flags: flagParser.getInnerFlags() || {},
            };
        });
    },
    encode: (_self: any, value: Remark[]): { Remark: Remark }[] => {
        return value.map((remark) => {
            return {
                Remark: remark,
            };
        });
    },
};
