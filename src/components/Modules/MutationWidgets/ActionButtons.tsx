import React, { PureComponent, useMemo } from 'react';
import { InteractionManager, View } from 'react-native';
import { OptionsModalPresentationStyle } from 'react-native-navigation';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { ComponentTypes } from '@services/NavigationService';
import NetworkService from '@services/NetworkService';

import { Payload } from '@common/libs/payload';

import { LedgerEntryTypes, TransactionTypes } from '@common/libs/ledger/types/enums';
import { TransactionJson } from '@common/libs/ledger/types/transaction';

import { Button } from '@components/General';

import { AccountRepository } from '@store/repositories';

import { Props as SendViewProps } from '@screens/Send/types';
import { Props as ReviewTransactionModalProps } from '@screens/Modal/ReviewTransaction/types';

import Localize from '@locale';

import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';

enum ActionTypes {
    NEW_PAYMENT = 'NEW_PAYMENT',
    CANCEL_OFFER = 'CANCEL_OFFER',
    ACCEPT_NFTOKEN_OFFER = 'ACCEPT_NFTOKEN_OFFER',
    SELL_NFTOKEN = 'SELL_NFTOKEN',
    CANCEL_ESCROW = 'CANCEL_ESCROW',
    FINISH_ESCROW = 'FINISH_ESCROW',
    CANCEL_CHECK = 'CANCEL_CHECK',
    CASH_CHECK = 'CASH_CHECK',
    CANCEL_TICKET = 'CANCEL_TICKET',
}

interface State {
    availableActions?: ActionTypes[];
}

/* Action Button ==================================================================== */
const ActionButton: React.FC<{ actionType: ActionTypes; onPress: (actionType: ActionTypes) => void }> = ({
    actionType,
    onPress,
}) => {
    const buttonData = useMemo(() => {
        switch (actionType) {
            case ActionTypes.NEW_PAYMENT:
                return { label: Localize.t('events.newPayment'), secondary: false };
            case ActionTypes.CANCEL_OFFER:
                return { label: Localize.t('events.cancelOffer'), secondary: true };
            case ActionTypes.ACCEPT_NFTOKEN_OFFER:
                return { label: Localize.t('events.acceptOffer'), secondary: true };
            case ActionTypes.SELL_NFTOKEN:
                return { label: Localize.t('events.sellMyNFT'), secondary: true };
            case ActionTypes.CANCEL_ESCROW:
                return { label: Localize.t('events.cancelEscrow'), secondary: true };
            case ActionTypes.FINISH_ESCROW:
                return { label: Localize.t('events.finishEscrow'), secondary: false };
            case ActionTypes.CANCEL_CHECK:
                return { label: Localize.t('events.cancelCheck'), secondary: false };
            case ActionTypes.CASH_CHECK:
                return { label: Localize.t('events.cashCheck'), secondary: false };
            case ActionTypes.CANCEL_TICKET:
                return { label: Localize.t('events.cancelTicket'), secondary: false };
            default:
                return null;
        }
    }, [actionType]);

    if (!buttonData) {
        return null;
    }

    const onActionPress = () => {
        if (typeof onPress === 'function') {
            onPress(actionType);
        }
    };

    const { label, secondary } = buttonData;

    return <Button rounded secondary={secondary} label={label} onPress={onActionPress} />;
};

/* Component ==================================================================== */
class ActionButtons extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            availableActions: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setAvailableActions);
    }

    setAvailableActions = () => {
        const { item, account } = this.props;

        const spendableAccounts = AccountRepository.getSpendableAccounts();

        const isAccountSpendable = spendableAccounts.find((acc) => acc.address === account.address);

        // account is not spendable just return
        if (!isAccountSpendable) {
            return;
        }

        const availableActions: ActionTypes[] = [];

        switch (item.Type) {
            case TransactionTypes.Payment:
                // only new payment
                if (item.Account === account.address) {
                    // check if we can make new payment base on sent currency
                    if (item.DeliveredAmount?.currency !== NetworkService.getNativeAsset()) {
                        const trustLine = account.lines?.find(
                            (line) =>
                                line.currency.currencyCode === item.DeliveredAmount?.currency &&
                                line.currency.issuer === item.DeliveredAmount?.issuer &&
                                Number(line.balance) > 0,
                        );
                        // do not show the button if user does not have the TrustLine anymore
                        if (!trustLine) {
                            break;
                        }
                    }
                    availableActions.push(ActionTypes.NEW_PAYMENT);
                }
                break;
            case LedgerEntryTypes.Offer:
                availableActions.push(ActionTypes.CANCEL_OFFER);
                break;
            case LedgerEntryTypes.NFTokenOffer:
                if (item.Owner === account.address) {
                    availableActions.push(ActionTypes.CANCEL_OFFER);
                } else if (!item.Destination || item.Destination === account.address) {
                    if (item.Flags?.tfSellToken) {
                        availableActions.push(ActionTypes.ACCEPT_NFTOKEN_OFFER);
                    } else {
                        availableActions.push(ActionTypes.SELL_NFTOKEN);
                    }
                }
                break;
            case LedgerEntryTypes.Escrow:
                if (item.isExpired) {
                    availableActions.push(ActionTypes.CANCEL_ESCROW);
                }
                if (item.canFinish) {
                    availableActions.push(ActionTypes.FINISH_ESCROW);
                }
                break;
            case LedgerEntryTypes.Check:
                if (item.Destination === account.address && !item.isExpired) {
                    availableActions.push(ActionTypes.CASH_CHECK);
                }
                if (!item.isExpired) {
                    availableActions.push(ActionTypes.CANCEL_CHECK);
                }
                break;
            case LedgerEntryTypes.Ticket:
                availableActions.push(ActionTypes.CANCEL_TICKET);
                break;
            default:
                break;
        }

        this.setState({
            availableActions,
        });
    };

    onActionButtonPress = (actionType: ActionTypes) => {
        const { item, account } = this.props;

        // NEW PAYMENT
        if (actionType === ActionTypes.NEW_PAYMENT && item.Type === TransactionTypes.Payment) {
            const params = {
                scanResult: {
                    to: item.Destination,
                    tag: item.DestinationTag,
                },
            };
            if (item.DeliveredAmount!.currency !== NetworkService.getNativeAsset()) {
                const trustLine = account.lines?.find(
                    (line) =>
                        line.currency.currencyCode === item.DeliveredAmount?.currency &&
                        line.currency.issuer === item.DeliveredAmount?.issuer &&
                        Number(line.balance) > 0,
                );
                Object.assign(params, { currency: trustLine });
            }
            Navigator.push<SendViewProps>(AppScreens.Transaction.Payment, params);
        }

        // when the Escrow is eligible for release, we'll leave out the button if an escrow has a condition,
        // in which case we will show a message and return
        if (actionType === ActionTypes.FINISH_ESCROW && item.Type === TransactionTypes.EscrowFinish && item.Condition) {
            Navigator.showAlertModal({
                type: 'warning',
                text: Localize.t('events.pleaseReleaseThisEscrowUsingTheToolUsedToCreateTheEscrow'),
                buttons: [
                    {
                        text: Localize.t('global.ok'),
                        onPress: () => {},
                        light: false,
                    },
                ],
            });
            return;
        }

        const craftedTxJson = {} as TransactionJson;

        switch (actionType) {
            case ActionTypes.CANCEL_OFFER:
                if (item.Type === LedgerEntryTypes.Offer) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.OfferCancel,
                        OfferSequence: item.Sequence,
                    });
                } else if (item.Type === LedgerEntryTypes.NFTokenOffer) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.NFTokenCancelOffer,
                        NFTokenOffers: [item.Index],
                    });
                }
                break;
            case ActionTypes.ACCEPT_NFTOKEN_OFFER:
            case ActionTypes.SELL_NFTOKEN:
                if (item.Type === LedgerEntryTypes.NFTokenOffer) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.NFTokenAcceptOffer,
                        NFTokenSellOffer: item.Flags?.tfSellToken ? item.Index : undefined,
                        NFTokenBuyOffer: !item.Flags?.tfSellToken ? item.Index : undefined,
                    });
                }
                break;
            case ActionTypes.CANCEL_ESCROW:
                if (item.Type === LedgerEntryTypes.Escrow) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.EscrowCancel,
                        Owner: item.Account,
                        PreviousTxnID: item.PreviousTxnID,
                    });
                }
                break;
            case ActionTypes.FINISH_ESCROW:
                if (item.Type === LedgerEntryTypes.Escrow) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.EscrowFinish,
                        Owner: item.Account,
                        PreviousTxnID: item.PreviousTxnID,
                    });
                }
                break;
            case ActionTypes.CANCEL_CHECK:
                if (item.Type === LedgerEntryTypes.Check) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.CheckCancel,
                        CheckID: item.Index,
                    });
                }
                break;
            case ActionTypes.CASH_CHECK:
                if (item.Type === LedgerEntryTypes.Check) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.CheckCash,
                        CheckID: item.Index,
                    });
                }
                break;
            case ActionTypes.CANCEL_TICKET:
                if (item.Type === LedgerEntryTypes.Ticket) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.AccountSet,
                        Sequence: 0,
                        TicketSequence: item.TicketSequence,
                    });
                }
                break;
            default:
                break;
        }

        if (typeof craftedTxJson !== 'undefined' && craftedTxJson.TransactionType) {
            // assign current account for crafted transaction
            Object.assign(craftedTxJson, { Account: account.address });

            // generate payload
            const payload = Payload.build(craftedTxJson);

            Navigator.showModal<ReviewTransactionModalProps>(
                AppScreens.Modal.ReviewTransaction,
                {
                    payload,
                    onResolve: () => {
                        Navigator.pop();
                    },
                },
                { modalPresentationStyle: OptionsModalPresentationStyle.fullScreen },
            );
        }
    };

    renderActionButtons = () => {
        const { availableActions } = this.state;

        if (!availableActions) {
            return null;
        }

        return availableActions.map((type) => (
            <ActionButton key={`action-button-${type}`} actionType={type} onPress={this.onActionButtonPress} />
        ));
    };

    render() {
        const { componentType } = this.props;
        const { availableActions } = this.state;

        if (!availableActions || availableActions.length === 0 || componentType === ComponentTypes.Modal) {
            return null;
        }

        return <View style={styles.itemContainer}>{this.renderActionButtons()}</View>;
    }
}

export default ActionButtons;
