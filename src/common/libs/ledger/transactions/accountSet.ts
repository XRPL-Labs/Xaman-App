/**
 * AccountSet transaction Parser
 */

import BigNumber from 'bignumber.js';
import { get, isUndefined } from 'lodash';
import { HexEncoding } from '@common/utils/string';

import BaseTransaction from './base';
import Flag from '../parser/common/flag';

/* Types ==================================================================== */
import { TransactionJSONType } from '../types';

/* Class ==================================================================== */
class AccountSet extends BaseTransaction {
    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'AccountSet';
        }

        this.fields = this.fields.concat([
            'ClearFlag',
            'Domain',
            'EmailHash',
            'MessageKey',
            'SetFlag',
            'TransferRate',
            'TickSize',
            'NFTokenMinter',
        ]);
    }

    get SetFlag(): string {
        const intFlag = get(this, ['tx', 'SetFlag'], undefined);
        if (isUndefined(intFlag)) return undefined;
        const flag = new Flag(this.Type, intFlag);
        return flag.parseIndices();
    }

    get ClearFlag(): string {
        const intFlag = get(this, ['tx', 'ClearFlag'], undefined);
        if (isUndefined(intFlag)) return undefined;
        const flag = new Flag(this.Type, intFlag);
        return flag.parseIndices();
    }

    get Domain(): string {
        const domain = get(this, ['tx', 'Domain'], undefined);
        if (domain) {
            return HexEncoding.toUTF8(domain);
        }
        return domain;
    }

    get MessageKey(): string {
        return get(this, ['tx', 'MessageKey'], undefined);
    }

    get EmailHash(): string {
        return get(this, ['tx', 'EmailHash'], undefined);
    }

    get TransferRate(): number {
        const transferRate = get(this, ['tx', 'TransferRate'], undefined);

        if (transferRate) {
            return new BigNumber(transferRate).dividedBy(1000000).minus(1000).dividedBy(10).toNumber();
        }

        return undefined;
    }

    get TickSize(): number {
        return get(this, ['tx', 'TickSize'], undefined);
    }

    get WalletLocator(): string {
        return get(this, ['tx', 'WalletLocator'], undefined);
    }

    get WalletSize(): number {
        return get(this, ['tx', 'WalletSize'], undefined);
    }

    get NFTokenMinter(): string {
        return get(this, ['tx', 'NFTokenMinter'], undefined);
    }
}

/* Export ==================================================================== */
export default AccountSet;
