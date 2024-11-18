import Localize from '@locale';

import { AccountModel } from '@store/models';

import URITokenBuy from './URITokenBuy.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { AssetDetails, AssetTypes, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class URITokenBuyInfo extends ExplainerAbstract<URITokenBuy, MutationsMixinType> {
    constructor(item: URITokenBuy & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.buyURIToken');
    }

    generateDescription(): string {
        const { Account, Amount, URITokenID } = this.item;

        return Localize.t('events.uriTokenBuyExplain', {
            address: Account,
            amount: Amount!.value,
            currency: Amount!.currency,
            tokenID: URITokenID,
        });
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: [
                {
                    currency: this.item.Amount!.currency,
                    value: this.item.Amount!.value,
                    effect: MonetaryStatus.IMMEDIATE_EFFECT,
                },
            ],
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.URIToken, owner: this.item.Account, uriTokenId: this.item.URITokenID! }];
    }
}

/* Export ==================================================================== */
export default URITokenBuyInfo;
