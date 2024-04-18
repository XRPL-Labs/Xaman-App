import { AccountModel } from '@store/models';

import { Account, AmountType } from '@common/libs/ledger/parser/types';
import { BalanceChanges } from '@common/libs/ledger/mixin/types';

export enum MonetaryStatus {
    IMMEDIATE_EFFECT = 'IMMEDIATE_EFFECT',
    POTENTIAL_EFFECT = 'POTENTIAL_EFFECT',
    NO_EFFECT = 'NO_EFFECT',
}

export type MonetaryDetails =
    | {
          mutate: BalanceChanges;
          factor?: AmountType & {
              effect: MonetaryStatus;
          };
      }
    | undefined;

export abstract class ExplainerAbstract<T, M = unknown> {
    protected item: T & M;
    protected account: AccountModel;

    protected constructor(item: T & M, account: AccountModel) {
        this.item = item;
        this.account = account;
    }

    abstract getEventsLabel(): string;
    abstract generateDescription(): string;
    abstract getParticipants(): { start?: Account; through?: Account; end?: Account };
    abstract getMonetaryDetails(): MonetaryDetails;
}

export type ValidationType<T> = (item: T, account?: AccountModel) => Promise<void>;
