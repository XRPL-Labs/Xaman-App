import Localize from '@locale';

import { AccountModel } from '@store/models';

import Batch from './Batch.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class BatchInfo extends ExplainerAbstract<Batch, MutationsMixinType> {
    constructor(item: Batch & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        // if (!this.item.Permissions) {
        //     return Localize.t('txBatch.removeAuthorize');
        // }
        // if (this.item.Permissions && this.item.Permissions.length > 0) {
        //     return Localize.t('txBatch.objectLabel');
        // }
        const r: string[] = [
            Localize.t('txBatch.batch', {
                txCount: this.item.RawTransactions?.length || 0,
            }),
        ];

        if (this.item.BatchSigners && this.item.BatchSigners.length > 0) {
            r.push(
                Localize.t('txBatch.batchSignerC', {
                    signCount: this.item.BatchSigners.length,
                }),
            );
        }

        return r.join(' ');
    }

    generateDescription(): string {
        // const { Authorize } = this.item;

        const flag =
            this.item.Flags && Object.keys(this.item.Flags).filter((f) => this.item?.Flags && this.item.Flags[f])?.[0];

        const content: string[] = [
            Localize.t('txBatch.thisIsAnBatchTransaction', {
                signers: this.item.BatchSigners?.length || 0,
                txs: this.item.RawTransactions?.length || 0,
            }),
        ];

        if (flag) {
            content.push(
                Localize.t('txBatch.batchExecutionType', {
                    batchExecution: Localize.t(`txBatch.batchExecution_${flag}`),
                }),
            );
        }

        // if (Authorize && this.item?.Permissions && this.item.Permissions.length > 0) {
        //     content.push(Localize.t('txBatch.itSetsAccountAuthorizeTo', { authorize: Authorize }));

        //     content.push(
        //         Localize.t('txBatch.itSetsThesePermissions', {
        //             permissions: `\n\n - ${this.item.___translatedDelegations.join('\n - ')}`,
        //         }),
        //     );
        // }

        // if (Authorize && (!this.item?.Permissions || this.item.Permissions.length === 0)) {
        //     content.push(Localize.t('txBatch.itRemoves', { authorize: Authorize }));
        // }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            // end: this.item.Authorize ? { address: this.item.Authorize, tag: undefined } : undefined,
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
export default BatchInfo;
