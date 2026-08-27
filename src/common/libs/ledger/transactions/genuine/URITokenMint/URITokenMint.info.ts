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
        const viewer = this.account?.address;
        const isMinter = !!viewer && this.item.Account === viewer;
        const isDestination = !!viewer && this.item.Destination === viewer;
        const hasAmount = typeof this.item.Amount !== 'undefined';
        const hasDestination = typeof this.item.Destination !== 'undefined';
        const isRemitOutput = !!this.item.MetaData?.ParentRemitID;

        // Remit delivers the token; it is never an offer
        if (isRemitOutput) {
            if (isDestination && !isMinter) {
                return Localize.t('events.uriTokenSentToYou');
            }
            return Localize.t('events.uriTokenSent');
        }

        // Sender/minter, including self-destination: never "to you"
        if (isMinter) {
            if (hasDestination && !hasAmount) {
                return Localize.t('events.uriTokenSent');
            }
            return Localize.t('events.mintURIToken');
        }

        if (isDestination) {
            // Mint with Amount is a sell offer; no Amount is a delivery
            if (hasAmount) {
                return Localize.t('events.uriTokenOfferedToYou');
            }
            return Localize.t('events.uriTokenSentToYou');
        }

        if (hasDestination && !hasAmount) {
            return Localize.t('events.uriTokenSent');
        }

        return Localize.t('events.mintURIToken');
    }

    generateDescription() {
        const content: string[] = [];
        const isRemitOutput = !!this.item.MetaData?.ParentRemitID;
        const hasAmount = typeof this.item.Amount !== 'undefined';

        if (hasAmount && !isRemitOutput) {
            content.push(
                Localize.t('events.uriTokenMintAmount', {
                    value: this.item.Amount.value,
                    currency: NormalizeCurrencyCode(this.item.Amount.currency),
                }),
            );
        }

        if (typeof this.item.Destination !== 'undefined') {
            const explainKey =
                isRemitOutput || !hasAmount
                    ? 'events.uriTokenSentExplain'
                    : 'events.uriTokenDestinationExplain';
            content.push(
                Localize.t(explainKey, {
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
