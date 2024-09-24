/**
 * AccountSet transaction
 */

import BigNumber from 'bignumber.js';
import { get, isUndefined } from 'lodash';

import { HexEncoding } from '@common/utils/string';

import Flag from '@common/libs/ledger/parser/common/flag';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class AccountSet extends BaseTransaction {
    public static Type = TransactionTypes.AccountSet as const;
    public readonly Type = AccountSet.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AccountSet.Type;
        }

        this.fields = this.fields.concat([
            'SetFlag',
            'ClearFlag',
            'Domain',
            'EmailHash',
            'MessageKey',
            'TransferRate',
            'TickSize',
            'NFTokenMinter',
            'WalletLocator',
            'WalletSize',
        ]);
    }

    public isNoOperation(): boolean {
        return (
            isUndefined(this.SetFlag) &&
            isUndefined(this.ClearFlag) &&
            isUndefined(this.Domain) &&
            isUndefined(this.EmailHash) &&
            isUndefined(this.MessageKey) &&
            isUndefined(this.TransferRate) &&
            isUndefined(this.TickSize) &&
            isUndefined(this.NFTokenMinter) &&
            isUndefined(this.WalletLocator) &&
            isUndefined(this.WalletSize)
        );
    }

    public isCancelTicket(): boolean {
        return (
            !isUndefined(this.TicketSequence) &&
            this.TicketSequence > 0 &&
            !isUndefined(this.Sequence) &&
            this.Sequence === 0
        );
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

        if (isUndefined(transferRate)) {
            return undefined;
        }

        if (transferRate === 0) {
            return 0;
        }

        return new BigNumber(transferRate).dividedBy(1000000).minus(1000).dividedBy(10).toNumber();
    }

    get TickSize(): number {
        return get(this, ['tx', 'TickSize'], undefined);
    }

    get NFTokenMinter(): string {
        return get(this, ['tx', 'NFTokenMinter'], undefined);
    }

    get WalletLocator(): string {
        return get(this, ['tx', 'WalletLocator'], undefined);
    }

    get WalletSize(): number {
        return get(this, ['tx', 'WalletSize'], undefined);
    }
}

/* Export ==================================================================== */
export default AccountSet;
