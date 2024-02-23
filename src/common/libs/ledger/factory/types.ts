import { AccountModel } from '@store/models';

import { Account, AmountType } from '@common/libs/ledger/parser/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

export enum MonetaryStatus {
    IMMEDIATE_EFFECT,
    POTENTIAL_EFFECT,
    NO_EFFECT,
}

export abstract class ExplainerAbstract<T> {
    protected item: T & MutationsMixinType;
    protected account: AccountModel;

    protected constructor(item: T & MutationsMixinType, account: AccountModel) {
        this.item = item;
        this.account = account;
    }

    abstract getEventsLabel(): string;
    abstract generateDescription(): string;

    abstract getParticipants(): { start?: Account; through?: Account; end?: Account };

    abstract getMonetaryDetails():
        | {
              mutate?: {
                  sent?: AmountType;
                  received?: AmountType;
              };
              factor?: AmountType & {
                  effect: MonetaryStatus;
              };
          }
        | undefined;
}

export type ValidationType<T> = (item: T, account?: AccountModel) => Promise<void>;
