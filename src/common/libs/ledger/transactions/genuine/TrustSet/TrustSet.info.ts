import Localize from '@locale';

import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import TrustSet from './TrustSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class TrustSetInfo extends ExplainerAbstract<TrustSet, MutationsMixinType> {
    constructor(item: TrustSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        // incoming TrustLine
        if (this.item.Account !== this.account.address) {
            if (this.item.Limit === 0) {
                return Localize.t('events.incomingTrustLineRemoved');
            }
            return Localize.t('events.incomingTrustLineAdded');
        }
        const ownerCountChange = this.item.OwnerCountChange(this.account.address);
        if (ownerCountChange) {
            if (ownerCountChange.action === OperationActions.INC) {
                return Localize.t('events.addedATrustLine');
            }
            return Localize.t('events.removedATrustLine');
        }
        return Localize.t('events.updatedATrustLine');
    }

    generateDescription(): string {
        const ownerCountChange = this.item.OwnerCountChange(this.account.address);

        if (ownerCountChange && ownerCountChange.action === OperationActions.DEC) {
            return Localize.t('events.itRemovedTrustLineCurrencyTo', {
                currency: NormalizeCurrencyCode(this.item.Currency),
                issuer: this.item.Issuer,
            });
        }

        return Localize.t('events.itEstablishesTrustLineTo', {
            limit: this.item.Limit,
            currency: NormalizeCurrencyCode(this.item.Currency),
            issuer: this.item.Issuer,
            address: this.item.Account,
        });
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Issuer, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default TrustSetInfo;
