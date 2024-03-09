import Localize from '@locale';

import { AccountModel } from '@store/models';

import NFTokenMint from './NFTokenMint.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

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

        return content.join('\n');
    };

    getParticipants = () => {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end:
                this.item.Issuer && this.item.Issuer !== this.item.Account
                    ? { address: this.item.Issuer, tag: undefined }
                    : undefined,
        };
    };

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default NFTokenMintInfo;
