import React, { PureComponent } from 'react';

import { LedgerEntryTypes, TransactionTypes } from '@common/libs/ledger/types/enums';
import { OfferStatus } from '@common/libs/ledger/parser/types';

import { TextPlaceholder } from '@components/General';

import { NormalizeAmount, NormalizeCurrencyCode } from '@common/utils/monetary';
import { Truncate } from '@common/utils/string';

import Localize from '@locale';

import styles from './styles';

import { Props } from './types';
/* Types ==================================================================== */
interface IProps extends Omit<Props, 'explainer'> {}

interface State {
    descriptionLabel?: string;
}

/* Component ==================================================================== */
class LabelBlock extends PureComponent<IProps, State> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            descriptionLabel: undefined,
        };
    }

    static getDescriptionLabel({ item, account, participant }: IProps) {
        if (item.Type === LedgerEntryTypes.Offer) {
            return `${Localize.formatNumber(NormalizeAmount(item.TakerGets!.value))} ${NormalizeCurrencyCode(
                item.TakerGets!.currency,
            )}/${NormalizeCurrencyCode(item.TakerPays!.currency)}`;
        }

        if (item.Type === LedgerEntryTypes.NFTokenOffer) {
            return item.NFTokenID;
        }

        if (item.Type === TransactionTypes.OfferCreate) {
            if ([OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].indexOf(item.GetOfferStatus(account.address)) > -1) {
                const balanceChanges = item.BalanceChange(account.address);

                const takerGot = balanceChanges?.sent!;
                const takerPaid = balanceChanges?.received!;

                return `${Localize.formatNumber(NormalizeAmount(takerGot.value))} ${NormalizeCurrencyCode(
                    takerGot.currency,
                )}/${NormalizeCurrencyCode(takerPaid.currency)}`;
            }
            return `${Localize.formatNumber(NormalizeAmount(item.TakerGets!.value))} ${NormalizeCurrencyCode(
                item.TakerGets!.currency,
            )}/${NormalizeCurrencyCode(item.TakerPays!.currency)}`;
        }

        if (item.Type === TransactionTypes.Payment) {
            if ([item.Account, item.Destination].indexOf(account.address) === -1) {
                const balanceChanges = item.BalanceChange(account.address);

                if (balanceChanges?.sent && balanceChanges?.received) {
                    return `${Localize.formatNumber(Number(balanceChanges.sent.value))} ${NormalizeCurrencyCode(
                        balanceChanges.sent.currency,
                    )}/${NormalizeCurrencyCode(balanceChanges.received.currency)}`;
                }
            }
        }

        if (participant?.name) return participant.name;
        if (participant?.address) return Truncate(participant.address, 16);

        return Localize.t('global.unknown');
    }

    static getDerivedStateFromProps(nextProps: IProps): Partial<State> | null {
        // TODO: improve this
        return {
            descriptionLabel: LabelBlock.getDescriptionLabel(nextProps),
        };
    }

    render() {
        const { participant } = this.props;
        const { descriptionLabel } = this.state;

        return (
            <TextPlaceholder style={styles.labelText} numberOfLines={1} isLoading={!participant}>
                {descriptionLabel}
            </TextPlaceholder>
        );
    }
}

export default LabelBlock;
