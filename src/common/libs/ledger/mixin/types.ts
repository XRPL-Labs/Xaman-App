import { AccountModel } from '@store/models';

import { BaseTransaction } from '@common/libs/ledger/transactions/common';

import {
    BalanceChangeType,
    OperationActions,
    OwnerCountChangeType,
    TransactionResult,
} from '@common/libs/ledger/parser/types';
import { SubmitResultType, VerifyResultType } from '@common/libs/ledger/types';
import { HookExecution } from '@common/libs/ledger/types/common';

export type BalanceChanges = {
    [OperationActions.INC]: BalanceChangeType[];
    [OperationActions.DEC]: BalanceChangeType[];
};

export type SignMethodType = 'PIN' | 'BIOMETRIC' | 'PASSPHRASE' | 'TANGEM' | 'OTHER';

/**
 * Interface definition for the MutationsMixinType class.
 * @interface MutationsMixinType
 */
export interface MutationsMixinType {
    BalanceChange(owner?: string): BalanceChanges;
    OwnerCountChange(owner?: string): OwnerCountChangeType | undefined;
    HookExecution(): HookExecution[];
    getXappIdentifier(): string | undefined;
    EmitDetails: any;
    Date: string | undefined;
    TransactionResult: TransactionResult;
    CTID: string;
    LedgerIndex: number;
    TransactionIndex: number;
}

/**
 * Interface definition for the SignMixinType class.
 */
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

/**
 * Represents a constructor for creating instances of mixing class.
 *
 * @typeParam T - The base transaction type which the constructor creates.
 */
export type Constructor<T = BaseTransaction> = new (...args: any[]) => T;

/**
 * Enum representing various mixing types.
 * @enum {string}
 * @readonly
 */
export enum MixingTypes {
    Mutation = 'Mutation',
    Sign = 'Sign',
}
