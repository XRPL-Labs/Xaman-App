import Localize from '@locale';

import { AccountModel } from '@store/models';

import MPToken from '@common/libs/ledger/objects/MPToken/MPToken.class';

/* Types ==================================================================== */
import { OperationActions } from '@common/libs/ledger/parser/types';
import { DecodeMPTokenIssuanceToIssuer } from '@common/utils/codec';
// import { NormalizeCurrencyCode } from '@common/utils/monetary';
import { AssetDetails, AssetTypes, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { MPTokenIssuance } from '../MPTokenIssuance';

/* Descriptor ==================================================================== */
class MPTokenInfo extends ExplainerAbstract<MPToken> {
    private issuance?: MPTokenIssuance;

    constructor(item: MPToken, account: AccountModel) {
        super(item, account);

        try {
            this.issuance = (this.item as any)?._object?._MPTokenIssuanceID;
        } catch (e) {
            //
        }
    }

    getEventsLabel(): string {
        // Owner => The owner of the URI Token.
        // Issuer => The issuer of the URI Token.
        // Destination => The intended recipient of the URI Token.
        // if (this.item.Destination) {
        //     // incoming offer
        //     if (this.item.Destination === this.account.address) {
        //         return Localize.t('events.MPTokenOfferedToYou');
        //     }
        //     // outgoing offer
        //     return Localize.t('events.sellMPToken');
        // }
        if (this.item?.MPTAmount) return Localize.t('mptoken.event');
        return Localize.t('mptoken.eventAuthOnly');
    }

    generateDescription(): string {
        const content: string[] = [];

        if (this.item?.MPTAmount) {
            content.push(
                Localize.t('mptoken.explain', {
                    issuer: DecodeMPTokenIssuanceToIssuer(String(this.item.MPTokenIssuanceID)),
                }),
            );
        } else {
            content.push(
                Localize.t('mptoken.explainAuthOnly', {
                    issuer: DecodeMPTokenIssuanceToIssuer(String(this.item.MPTokenIssuanceID)),
                }),
            );
        }
        return content.join('\n');
    }

    getParticipants() {
        return {
            // start: { address: this.item.Account, tag: undefined },
            start: { address: DecodeMPTokenIssuanceToIssuer(String(this.item.MPTokenIssuanceID)), tag: undefined },
            end: { address: this.item.Account, tag: undefined },
        };
    }

    getMonetaryDetails() {
        const factor = [];
        if (this.item.MPTAmount) {
            let value = this.item?.MPTAmount || 0;
            if (this.issuance) {
                if (this.issuance.AssetScale && this.issuance.AssetScale > 1) {
                    value /= 10 ** this.issuance.AssetScale;
                }
            }
            factor.push({
                currency: ' ',
                value: String(value),
                issuer: DecodeMPTokenIssuanceToIssuer(String(this.item.MPTokenIssuanceID)),
                mpt_issuance_id: String(this.item.MPTokenIssuanceID),
                effect: 'POTENTIAL_EFFECT' as MonetaryStatus,
                // this.item.Account === this.account.address
                //     ? MonetaryStatus.IMMEDIATE_EFFECT
                //     : MonetaryStatus.NO_EFFECT,
            });
        }

        // if (typeof this.item.MPTAmount !== 'undefined') {
        //     // factor.push({
        //     //     ...this.item.MPTAmount!,
        //     //     effect: MonetaryStatus.POTENTIAL_EFFECT,
        //     //     action: this.item.Account === this.account.address ? OperationActions.INC : OperationActions.DEC,
        //     // });
        //     factor: [
        //         {
        //             currency: this.item.Escrow!.Amount!.currency,
        //             value: this.item.Escrow!.Amount!.value,
        //             effect:
        //                 this.item.Account === this.account.address
        //                     ? MonetaryStatus.IMMEDIATE_EFFECT
        //                     : MonetaryStatus.NO_EFFECT,
        //         },
        //     ],
        // }

        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor,
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.MPToken, mpTokenId: this.item.MPTokenID, owner: this.item.Account }];
    }
}

/* Export ==================================================================== */
export default MPTokenInfo;
