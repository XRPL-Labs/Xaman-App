import Localize from '@locale';
import URITokenCancelSellOffer from './URITokenCancelSellOffer.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { AssetDetails, AssetTypes, ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { AccountModel } from '@store/models';

/* Descriptor ==================================================================== */
class URITokenCancelSellOfferInfo extends ExplainerAbstract<URITokenCancelSellOffer, MutationsMixinType> {
    constructor(item: URITokenCancelSellOffer & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.cancelURITokenSellOffer');
    }

    generateDescription(): string {
        return Localize.t('events.theTransactionWillCancelURITokenOffer', {
            address: this.item.Account,
            tokenId: this.item.URITokenID,
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
            factor: undefined,
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.URIToken, owner: this.item.Account, uriTokenId: this.item.URITokenID! }];
    }
}

/* Export ==================================================================== */
export default URITokenCancelSellOfferInfo;
