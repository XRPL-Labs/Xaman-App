import Localize from '@locale';

import { AccountModel } from '@store/models';

import MPTokenIssuance from '@common/libs/ledger/objects/MPTokenIssuance/MPTokenIssuance.class';

/* Types ==================================================================== */
import { AssetDetails, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
// import { NormalizeCurrencyCode } from '@common/utils/monetary';
import { DecodeMPTokenIssuanceToIssuer } from '@common/utils/codec';

/* Descriptor ==================================================================== */
class MPTokenIssuanceInfo extends ExplainerAbstract<MPTokenIssuance> {
    constructor(item: MPTokenIssuance, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        // Owner => The owner of the URI Token.
        // Issuer => The issuer of the URI Token.
        // Destination => The intended recipient of the URI Token.
        // if (this.item.Destination) {
        //     // incoming offer
        //     if (this.item.Destination === this.account.address) {
        //         return Localize.t('events.MPTokenIssuanceOfferedToYou');
        //     }
        //     // outgoing offer
        //     return Localize.t('events.sellMPTokenIssuance');
        // }

        return Localize.t('mptokenIssuance.event');
    }

    generateDescription(): string {
        const content: string[] = [];

        const maxAmount = this.item.MaximumAmount || 1;
        // const scale = this.item.AssetScale || 1;
        content.push(
            Localize.t('mptokenIssuance.explain', {
                amount: maxAmount,
                // scale,
                // actualTokens: maxAmount / (scale > 1 ? 10 ** (scale || 1) : 1),
            }),
        );

        // content.push(`\nIssuance ID:\n${this.item.mpt_issuance_id}`);

        // if (this.item?.MPTokenMetadata) {
        //     content.push(`\nMetadata:\n${this.item?.MPTokenMetadata}`);
        // }
        // if (this.item?.TransferFee) {
        //     content.push(`\nTransferFee:\n${this.item.TransferFee / 1000}%`);
        // }
        // if (this.item?.OutstandingAmount) {
        //     const scale = scale > 1 ? 10 ** (scale || 1) : 1;
        //     content.push(
        //         `\nOutstandingAmount:\n${this.item.OutstandingAmount / (scale)} (${this.item.OutstandingAmount})`,
        //     );
        // }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Issuer, tag: undefined },
        };
    }

    getMonetaryDetails() {
        const factor = [];
        if (this.item.OutstandingAmount) {
            let value = this.item?.OutstandingAmount || 0;
            if (this.item.AssetScale && this.item.AssetScale > 1) {
                value /= 10 ** this.item.AssetScale;
            }
            factor.push({
                currency: ' ',
                value: String(value * -1),
                issuer: DecodeMPTokenIssuanceToIssuer(String(this.item.mpt_issuance_id)),
                mpt_issuance_id: String(this.item.mpt_issuance_id),
                effect: 'POTENTIAL_EFFECT' as MonetaryStatus,
                // this.item.Account === this.account.address
                //     ? MonetaryStatus.IMMEDIATE_EFFECT
                //     : MonetaryStatus.NO_EFFECT,
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
        return [];
    }
}

/* Export ==================================================================== */
export default MPTokenIssuanceInfo;
