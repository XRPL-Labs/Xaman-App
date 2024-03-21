import { AccountModel } from '@store/models';

import { BaseTransaction } from '@common/libs/ledger/transactions/common';

import { AmountType, OwnerCountChangeType, TransactionResult } from '@common/libs/ledger/parser/types';
import { SubmitResultType, VerifyResultType } from '@common/libs/ledger/types';
import { HookExecution } from '@common/libs/ledger/types/common';

export interface MutationsMixinType {
    BalanceChange(owner?: string): {
        sent?: AmountType;
        received?: AmountType;
    };
    OwnerCountChange(owner?: string): OwnerCountChangeType;
    HookExecution(): HookExecution[];
    getXappIdentifier(): string | undefined;
    EmitDetails: any;
    Date: string | undefined;
    TransactionResult: TransactionResult;
    CTID: string;
    LedgerIndex: number;
    TransactionIndex: number;
}

export type SignMethodType = 'PIN' | 'BIOMETRIC' | 'PASSPHRASE' | 'TANGEM' | 'OTHER';

export interface SignMixinType {
    SignedBlob?: string;
    SignerPubKey?: string;
    SignMethod?: SignMethodType;
    SignerAccount?: string;

    get SubmitResult(): SubmitResultType | undefined;
    set SubmitResult(result: SubmitResultType);

    get VerifyResult(): VerifyResultType | undefined;
    set VerifyResult(result: VerifyResultType);

    get TransactionResult(): TransactionResult;

    prepare(account: AccountModel): Promise<void>;
    populateFields(options?: { lastLedgerOffset?: number }): void;
    sign(account: AccountModel, multiSign?: boolean): Promise<string>;
    verify(): Promise<VerifyResultType>;
    submit(): Promise<SubmitResultType>;
    abort(): void;
}

export type Constructor<T = BaseTransaction> = new (...args: any[]) => T;

export enum MixingTypes {
    Mutation = 'Mutation',
    Sign = 'Sign',
}
