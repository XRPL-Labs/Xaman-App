import Localize from '@locale';
import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import URITokenMint from './URITokenMint.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { AssetDetails, AssetTypes, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class URITokenMintInfo extends ExplainerAbstract<URITokenMint, MutationsMixinType> {
    constructor(item: URITokenMint & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel() {
        // minted uri token offered to owner
        if (this.item.Destination === this.account.address) {
            return Localize.t('events.uriTokenOfferedToYou');
        }

        // owner minted uri token
        return Localize.t('events.mintURIToken');
    }

    generateDescription() {
        const content: string[] = [];

        if (typeof this.item.Amount !== 'undefined') {
            content.push(
                Localize.t('events.uriTokenMintAmount', {
                    value: this.item.Amount.value,
                    currency: NormalizeCurrencyCode(this.item.Amount.currency),
                }),
            );
        }

        if (typeof this.item.Destination !== 'undefined') {
            content.push(
                Localize.t('events.uriTokenDestinationExplain', {
                    address: this.item.Destination,
                }),
            );
        }

        if (typeof this.item.Digest !== 'undefined') {
            content.push(Localize.t('events.theTokenHasADigest', { digest: this.item.Digest }));
        }

        content.push(Localize.t('events.theURIForThisTokenIs', { uri: this.item.URI }));

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Destination, tag: undefined },
        };
    }

    getMonetaryDetails() {
        const factor = [];

        if (typeof this.item.Amount !== 'undefined') {
            factor.push({
                ...this.item.Amount!,
                effect: MonetaryStatus.POTENTIAL_EFFECT,
                action: this.item.Account === this.account.address ? OperationActions.INC : OperationActions.DEC,
            });
        }

        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor,
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.URIToken, owner: this.item.Account, uriTokenId: this.item.URITokenID }];
    }
}

/* Export ==================================================================== */
export default URITokenMintInfo;
