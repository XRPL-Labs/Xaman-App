import Localize from '@locale';

import { AccountModel } from '@store/models';

import DepositPreauth from '@common/libs/ledger/objects/DepositPreauth/DepositPreauth.class';

/* Types ==================================================================== */
import { AssetDetails, ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
// import { NormalizeCurrencyCode } from '@common/utils/monetary';

/* Descriptor ==================================================================== */
class DepositPreauthInfo extends ExplainerAbstract<DepositPreauth> {
    constructor(item: DepositPreauth, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('depositPreauth.title');
    }

    generateDescription(): string {
        const content: string[] = [];

        content.push(Localize.t('depositPreauth.eventThisIsA'));

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: undefined },
            ...(this.item.Authorize && { end: { address: this.item.Authorize, tag: undefined } }),
        };
    }

    getMonetaryDetails() {
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [];
    }
}

/* Export ==================================================================== */
export default DepositPreauthInfo;
