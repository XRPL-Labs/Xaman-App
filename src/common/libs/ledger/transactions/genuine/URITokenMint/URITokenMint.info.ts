import Localize from '@locale';
import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import URITokenMint from './URITokenMint.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class URITokenMintInfo extends ExplainerAbstract<URITokenMint, MutationsMixinType> {
    constructor(item: URITokenMint & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel() {
        return Localize.t('events.mintURIToken');
    }

    generateDescription() {
        const { URI, Digest, Amount, Destination } = this.item;

        const content: string[] = [];

        content.push(Localize.t('events.theURIForThisTokenIs', { uri: URI }));

        if (typeof Digest !== 'undefined') {
            content.push(Localize.t('events.theTokenHasADigest', { digest: Digest }));
        }

        if (typeof Amount !== 'undefined') {
            content.push(
                Localize.t('events.uriTokenMintAmount', {
                    value: Amount.value,
                    currency: NormalizeCurrencyCode(Amount.currency),
                }),
            );
        }

        if (typeof Destination !== 'undefined') {
            content.push(
                Localize.t('events.uriTokenDestinationExplain', {
                    address: Destination,
                }),
            );
        }

        return content.join('\n');
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
}

/* Export ==================================================================== */
export default URITokenMintInfo;
