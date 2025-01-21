import moment from 'moment-timezone';

import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import Localize from '@locale';

import NFTokenMint from './NFTokenMint.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { AssetDetails, AssetTypes, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class NFTokenMintInfo extends ExplainerAbstract<NFTokenMint, MutationsMixinType> {
    constructor(item: NFTokenMint & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.mintNFT');
    };

    generateDescription = (): string => {
        const content = [Localize.t('events.theTokenIdIs', { tokenID: this.item.NFTokenID })];

        if (typeof this.item.TransferFee !== 'undefined') {
            content.push(Localize.t('events.theTokenHasATransferFee', { transferFee: this.item.TransferFee }));
        }

        if (typeof this.item.NFTokenTaxon !== 'undefined') {
            content.push(Localize.t('events.theTokenTaxonForThisTokenIs', { taxon: this.item.NFTokenTaxon }));
        }

        if (this.item.Amount) {
            content.push(
                Localize.t('events.nftOfferSellExplain', {
                    address: this.item.Account,
                    tokenID: this.item.NFTokenID,
                    amount: this.item.Amount!.value,
                    currency: NormalizeCurrencyCode(this.item.Amount!.currency),
                }),
            );
        }

        if (this.item.Destination) {
            content.push(Localize.t('events.thisNftOfferMayOnlyBeAcceptedBy', { address: this.item.Destination }));
        }

        if (this.item.Expiration) {
            content.push(
                Localize.t('events.theOfferExpiresAtUnlessCanceledOrAccepted', {
                    expiration: moment(this.item.Expiration).format('LLLL'),
                }),
            );
        }

        return content.join('\n');
    };

    getParticipants = () => {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            through:
                this.item.Issuer && this.item.Issuer !== this.item.Account
                    ? { address: this.item.Issuer, tag: undefined }
                    : undefined,
            end: { address: this.item.Destination, tag: undefined },
        };
    };

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: this.item.Amount
                ? [
                      {
                          currency: this.item.Amount!.currency,
                          value: this.item.Amount!.value,
                          effect: MonetaryStatus.POTENTIAL_EFFECT,
                          action: OperationActions.INC,
                      },
                  ]
                : [],
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.NFToken, nfTokenId: this.item.NFTokenID }];
    }
}

/* Export ==================================================================== */
export default NFTokenMintInfo;
