import Localize from '@locale';

import { AccountModel } from '@store/models';

import URIToken from '@common/libs/ledger/objects/URIToken/URIToken.class';

/* Types ==================================================================== */
import { AssetDetails, AssetTypes, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
import { NormalizeCurrencyCode } from '@common/utils/monetary';

/* Descriptor ==================================================================== */
class URITokenInfo extends ExplainerAbstract<URIToken> {
    constructor(item: URIToken, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        // Owner => The owner of the URI Token.
        // Issuer => The issuer of the URI Token.
        // Destination => The intended recipient of the URI Token.
        if (this.item.Destination) {
            // incoming offer
            if (this.item.Destination === this.account.address) {
                return Localize.t('events.uriTokenOfferedToYou');
            }
            // outgoing offer
            return Localize.t('events.sellURIToken');
        }

        return Localize.t('global.uritoken');
    }

    generateDescription(): string {
        const content: string[] = [];

        if (typeof this.item.Destination !== 'undefined') {
            if (this.item.Destination === this.account.address) {
                content.push(
                    Localize.t('events.uriTokenOfferBuyExplain', {
                        address: this.item.Owner,
                        tokenID: this.item.Index,
                        amount: this.item.Amount!.value,
                        currency: NormalizeCurrencyCode(this.item.Amount!.currency),
                    }),
                );
            } else {
                content.push(
                    Localize.t('events.nftOfferSellExplain', {
                        address: this.item.Owner,
                        tokenID: this.item.Index,
                        amount: this.item.Amount!.value,
                        currency: NormalizeCurrencyCode(this.item.Amount!.currency),
                    }),
                );
            }
        }

        if (typeof this.item.Owner !== 'undefined') {
            content.push(Localize.t('events.theUriTokenOwnerIs', { address: this.item.Owner }));
        }

        if (typeof this.item.Destination !== 'undefined') {
            content.push(Localize.t('events.thisUriTokenOfferCanOnlyBeAcceptedBy', { address: this.item.Destination }));
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Owner, tag: undefined },
            end: { address: this.item.Destination, tag: undefined },
        };
    }

    getMonetaryDetails() {
        const factor = [];
        if (typeof this.item.Amount !== 'undefined') {
            factor.push({
                ...this.item.Amount!,
                effect: MonetaryStatus.POTENTIAL_EFFECT,
                action: this.item.Owner === this.account.address ? OperationActions.INC : OperationActions.DEC,
            });
        }

        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor,
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.URIToken, uriTokenId: this.item.URITokenID, owner: this.item.Owner }];
    }
}

/* Export ==================================================================== */
export default URITokenInfo;
