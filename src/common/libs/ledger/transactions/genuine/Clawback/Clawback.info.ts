import Localize from '@locale';

import { AccountModel } from '@store/models';

import Clawback from './Clawback.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { DecodeMPTokenIssuanceToIssuer } from '@common/utils/codec';

/* Descriptor ==================================================================== */
class ClawbackInfo extends ExplainerAbstract<Clawback, MutationsMixinType> {
    constructor(item: Clawback & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.clawback');
    }

    generateDescription(): string {
        return `This is an ${this.item.Type} transaction`;
    }

    getParticipants() {
        return {
            start: { address: this.item?.Holder || this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Amount!.issuer! || this.item.Account, tag: undefined },
        };
    }

    getMonetaryDetails() {
        // the token issuer's address is in the Account field,
        // and the token holder's address is in the Amount field's issuer sub-field.
        let bc = this.item.BalanceChange(this.account.address);
        try {
            if (bc.DEC.length < 1 && bc.INC.length < 1) {
                // No changes
                if (this.item?.Holder === this.account.address) {
                    // It was against my account
                    // Use inverted issuer balance change
                    // TODO: if MPT decode issuer
                    let account = this.item.Account;
                    if (this.item.Type === 'Clawback') {
                        account = this.item.Amount!.issuer!;
                    }
                    if (this.item?.Amount?.mpt_issuance_id) {
                        account = DecodeMPTokenIssuanceToIssuer(this.item.Amount.mpt_issuance_id);
                    }
                    bc = this.item.BalanceChange(account);
                    bc = { INC: bc.DEC, DEC: bc.INC };
                }
            }
        } catch {
            //
        }

        return {
            mutate: bc,
            factor: [
                {
                    currency: this.item.Amount!.currency,
                    value: this.item.Amount!.value,
                    effect: MonetaryStatus.IMMEDIATE_EFFECT,
                },
            ],
        };
    }
}

/* Export ==================================================================== */
export default ClawbackInfo;
