import React, { PureComponent, useMemo } from 'react';
import { InteractionManager, View } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { ComponentTypes } from '@services/NavigationService';
import NetworkService from '@services/NetworkService';

import { Payload, XAppOrigin } from '@common/libs/payload';

import { LedgerEntryTypes, TransactionTypes } from '@common/libs/ledger/types/enums';
import { AmountParser } from '@common/libs/ledger/parser/common';
import { TransactionJson } from '@common/libs/ledger/types/transaction';

import { Button } from '@components/General';

import { AccountRepository } from '@store/repositories';

import { Props as SendViewProps } from '@screens/Send/types';
import { Props as ReviewTransactionModalProps } from '@screens/Modal/ReviewTransaction/types';

import Localize from '@locale';

import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';
import { AppStyles } from '@theme/index';
import LedgerService from '@services/LedgerService';
import BigNumber from 'bignumber.js';
import BackendService from '@services/BackendService';
import { type XAppBrowserModalProps } from '@screens/Modal/XAppBrowser';

enum ActionTypes {
    OPEN_XAPP = 'OPEN_XAPP',
    NEW_PAYMENT = 'NEW_PAYMENT',
    CANCEL_OFFER = 'CANCEL_OFFER',
    REMOVE_DELEGATION = 'REMOVE_DELEGATION',
    ACCEPT_NFTOKEN_OFFER = 'ACCEPT_NFTOKEN_OFFER',
    CANCEL_NFTOKEN_OFFER = 'CANCEL_NFTOKEN_OFFER',
    ACCEPT_URITOKEN_OFFER = 'ACCEPT_URITOKEN_OFFER',
    SELL_NFTOKEN = 'SELL_NFTOKEN',
    SELL_URITOKEN = 'SELL_URITOKEN',
    CANCEL_ESCROW = 'CANCEL_ESCROW',
    FINISH_ESCROW = 'FINISH_ESCROW',
    CRON_SET = 'CRON_SET',
    CANCEL_CHECK = 'CANCEL_CHECK',
    CASH_CHECK = 'CASH_CHECK',
    CANCEL_TICKET = 'CANCEL_TICKET',
    DELETE_CREDENTIAL = 'DELETE_CREDENTIAL',
    ACCEPT_CREDENTIAL = 'ACCEPT_CREDENTIAL',
    DELETE_MPT_ISSUANCE = 'DELETE_MPT_ISSUANCE',
    DELETE_DEPOSIT_PREAUTH = 'DELETE_DEPOSIT_PREAUTH',
    REMOVE_MPT = 'REMOVE_MPT',
    REMOVE_PERMISSIONED_DOMAIN = 'REMOVE_PERMISSIONED_DOMAIN',
    DELETE_VAULT = 'DELETE_VAULT',
    DEPOSIT_VAULT = 'DEPOSIT_VAULT',
    WITHDRAW_VAULT = 'WITHDRAW_VAULT',
    DELETE_LOAN_BROKER = 'DELETE_LOAN_BROKER',
    DEPOSIT_LOAN_BROKER_COVER = 'DEPOSIT_LOAN_BROKER_COVER',
    WITHDRAW_LOAN_BROKER_COVER = 'WITHDRAW_LOAN_BROKER_COVER',
    DELETE_LOAN = 'DELETE_LOAN',
    PAY_LOAN = 'PAY_LOAN',
}

interface State {
    availableActions?: ActionTypes[];
    xAppIdentifier?: string;
}

/* Action Button ==================================================================== */
const ActionButton: React.FC<{ actionType: ActionTypes; onPress: (actionType: ActionTypes) => void }> = ({
    actionType,
    onPress,
}) => {
    const buttonData = useMemo(() => {
        switch (actionType) {
            case ActionTypes.OPEN_XAPP:
                return { label: Localize.t('global.openXApp'), secondary: false };
            case ActionTypes.NEW_PAYMENT:
                return { label: Localize.t('events.newPayment'), secondary: false };
            case ActionTypes.CANCEL_OFFER:
                return { label: Localize.t('events.cancelOffer'), secondary: true };
            case ActionTypes.REMOVE_DELEGATION:
                return { label: Localize.t('txDelegateSet.removeAuthorize'), secondary: false };
            case ActionTypes.CANCEL_NFTOKEN_OFFER:
                return { label: Localize.t('events.cancelOffer'), secondary: false };
            case ActionTypes.ACCEPT_NFTOKEN_OFFER:
                return { label: Localize.t('events.acceptOffer'), secondary: true };
            case ActionTypes.SELL_NFTOKEN:
                return { label: Localize.t('events.sellMyNFT'), secondary: true };
            case ActionTypes.SELL_URITOKEN:
                return { label: Localize.t('events.sellMyNFT'), secondary: true };
            case ActionTypes.ACCEPT_URITOKEN_OFFER:
                return { label: Localize.t('events.acceptOffer'), secondary: true };
            case ActionTypes.CANCEL_ESCROW:
                return { label: Localize.t('events.cancelEscrow'), secondary: true };
            case ActionTypes.CRON_SET:
                return { label: Localize.t('cronSet.remove'), secondary: true };
            case ActionTypes.FINISH_ESCROW:
                return { label: Localize.t('events.finishEscrow'), secondary: false };
            case ActionTypes.CANCEL_CHECK:
                return { label: Localize.t('events.cancelCheck'), secondary: true };
            case ActionTypes.CASH_CHECK:
                return { label: Localize.t('events.cashCheck'), secondary: false };
            case ActionTypes.CANCEL_TICKET:
                return { label: Localize.t('events.cancelTicket'), secondary: false };
            case ActionTypes.DELETE_CREDENTIAL:
                return { label: Localize.t('events.deleteCredential'), secondary: true };
            case ActionTypes.ACCEPT_CREDENTIAL:
                return { label: Localize.t('events.acceptCredential'), secondary: false };
            case ActionTypes.DELETE_MPT_ISSUANCE:
                return { label: Localize.t('mptokenIssuance.delete'), secondary: true };
            case ActionTypes.REMOVE_MPT:
                return { label: Localize.t('mptoken.delete'), secondary: true };
            case ActionTypes.REMOVE_PERMISSIONED_DOMAIN:
                return { label: Localize.t('permissionedDomain.remove'), secondary: true };
            case ActionTypes.DELETE_DEPOSIT_PREAUTH:
                return { label: Localize.t('depositPreauth.remove'), secondary: true };
            case ActionTypes.DELETE_VAULT:
                return { label: Localize.t('vault.delete'), secondary: true };
            case ActionTypes.DEPOSIT_VAULT:
                return { label: Localize.t('vault.deposit'), secondary: false };
            case ActionTypes.WITHDRAW_VAULT:
                return { label: Localize.t('vault.withdraw'), secondary: false };
            case ActionTypes.DELETE_LOAN_BROKER:
                return { label: Localize.t('loan.deleteLoanBroker'), secondary: true };
            case ActionTypes.DEPOSIT_LOAN_BROKER_COVER:
                return { label: Localize.t('loan.depositCover'), secondary: false };
            case ActionTypes.WITHDRAW_LOAN_BROKER_COVER:
                return { label: Localize.t('loan.withdrawCover'), secondary: false };
            case ActionTypes.DELETE_LOAN:
                return { label: Localize.t('loan.deleteLoan'), secondary: true };
            case ActionTypes.PAY_LOAN:
                return { label: Localize.t('loan.makePayment'), secondary: false };
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

    return <Button style={[styles.actionButton]} secondary={secondary} label={label} onPress={onActionPress} />;
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

    setAvailableActions = async () => {
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
                    
                    const acct = account?.address === item?.Destination ? item?.Account : item?.Destination;
                    const accountInfo = acct
                        ? await BackendService.getAddressInfo(acct)
                        : null;

                    if (accountInfo && accountInfo.no_direct_send === 1 && !item.DestinationTag) {
                        // We won't offer sending here directly unless if there's a
                        // destination tag, then we assume the destination knows
                        // how to process it
                        if (typeof accountInfo.xapp_identifier === 'string' && accountInfo.xapp_identifier !== '') {
                            this.setState({
                                xAppIdentifier: accountInfo.xapp_identifier,
                            });
                            availableActions.push(ActionTypes.OPEN_XAPP);
                        }
                    } else {
                        availableActions.push(ActionTypes.NEW_PAYMENT);
                    }
                }
                break;
            case LedgerEntryTypes.Offer:
                availableActions.push(ActionTypes.CANCEL_OFFER);
                break;
            case LedgerEntryTypes.Credential:
                if (item.Issuer === account.address || item.Subject === account.address) {
                    availableActions.push(ActionTypes.DELETE_CREDENTIAL);
                    if (item.Subject === account.address && !item.Flags?.lsfAccepted) {
                        availableActions.push(ActionTypes.ACCEPT_CREDENTIAL);
                    }
                }
                break;
            case LedgerEntryTypes.MPTokenIssuance:
                if (
                    Number(item?.OutstandingAmount || 0) === 0 &&
                    item.Issuer === account.address
                ) {
                    availableActions.push(ActionTypes.DELETE_MPT_ISSUANCE);
                }
                break;
            case LedgerEntryTypes.MPToken:
                if (!item?.MPTAmount) {
                    availableActions.push(ActionTypes.REMOVE_MPT);
                }
                break;
            case LedgerEntryTypes.PermissionedDomain:
                if (item.Owner === account.address) {
                    availableActions.push(ActionTypes.REMOVE_PERMISSIONED_DOMAIN);
                }
                break;
            case LedgerEntryTypes.DepositPreauth:
                if (
                    item.Type === LedgerEntryTypes.DepositPreauth &&
                    item.Account === account.address &&
                    typeof (item as any)?._object === 'object'
                ) {
                    availableActions.push(ActionTypes.DELETE_DEPOSIT_PREAUTH);
                }
                break;
            case LedgerEntryTypes.Delegate:
                availableActions.push(ActionTypes.REMOVE_DELEGATION);
                break;
            case LedgerEntryTypes.NFTokenOffer:
                if (item.Owner === account.address) {
                    availableActions.push(ActionTypes.CANCEL_OFFER);
                } else if (!item.Destination || item.Destination === account.address) {
                    if (item.Flags?.lsfSellNFToken) {
                        if (item.Destination === account.address) {
                            availableActions.push(ActionTypes.CANCEL_NFTOKEN_OFFER);
                        }
                        availableActions.push(ActionTypes.ACCEPT_NFTOKEN_OFFER);
                    } else {
                        availableActions.push(ActionTypes.SELL_NFTOKEN);
                    }
                }
                break;
            case LedgerEntryTypes.URIToken:
            case TransactionTypes.URITokenMint:
                if (item.Destination) {
                    if (item.Destination === account.address) {
                        availableActions.push(ActionTypes.ACCEPT_URITOKEN_OFFER);
                    } else {
                        availableActions.push(ActionTypes.CANCEL_OFFER);
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
            case LedgerEntryTypes.Cron:
                availableActions.push(ActionTypes.CRON_SET);
                break;
            case LedgerEntryTypes.Vault:
                // Anyone can deposit (if public)
                availableActions.push(ActionTypes.DEPOSIT_VAULT);
                // Only show withdraw if vault has assets
                if (item.AssetsTotal?.value && Number(item.AssetsTotal.value) > 0) {
                    availableActions.push(ActionTypes.WITHDRAW_VAULT);
                }
                // Only owner can delete
                if (item.Owner === account.address) {
                    availableActions.push(ActionTypes.DELETE_VAULT);
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
            case LedgerEntryTypes.LoanBroker:
                // Owner can deposit and withdraw cover
                if (item.Owner === account.address) {
                    availableActions.push(ActionTypes.DEPOSIT_LOAN_BROKER_COVER);
                    if (item.CoverAvailable && Number(item.CoverAvailable) > 0) {
                        availableActions.push(ActionTypes.WITHDRAW_LOAN_BROKER_COVER);
                    }
                    // Can delete if no active loans
                    if (!item.OwnerCount || item.OwnerCount === 0) {
                        availableActions.push(ActionTypes.DELETE_LOAN_BROKER);
                    }
                }
                break;
            case LedgerEntryTypes.Loan:
                // Borrower can pay and delete
                if (item.Borrower === account.address) {
                    availableActions.push(ActionTypes.PAY_LOAN);
                    availableActions.push(ActionTypes.DELETE_LOAN);
                }
                break;
            default:
                break;
        }

        this.setState({
            availableActions,
        });
    };

    onOpenXAppPress = () => {
        const { item } = this.props;
        const { xAppIdentifier } = this.state;
        
        requestAnimationFrame(() => {
            // dismiss the modal
            Navigator.dismissModal();
            requestAnimationFrame(() => {
                Navigator.dismissOverlay();
                requestAnimationFrame(() => {
                    Navigator.showModal<XAppBrowserModalProps>(
                        AppScreens.Modal.XAppBrowser,
                        {
                            identifier: xAppIdentifier!,
                            origin: XAppOrigin.EVENT_SEND,
                            originData: { txid: (item as any).hash },
                        },
                        {
                            modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                            modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
                        },
                    );
                });
            });
        });
    };    

    onActionButtonPress = async (actionType: ActionTypes) => {
        const { item, account } = this.props;

        if (actionType === ActionTypes.OPEN_XAPP) {
            this.onOpenXAppPress();
            return;
        }

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
            case ActionTypes.CRON_SET:
                Object.assign(craftedTxJson, {
                    TransactionType: TransactionTypes.CronSet,
                    Flags: 1,
                });
                break;
            case ActionTypes.DELETE_VAULT:
                if (item.Type === LedgerEntryTypes.Vault && item.Owner === account.address) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.VaultDelete,
                        VaultID: item.Index,
                    });
                }
                break;
            case ActionTypes.DEPOSIT_VAULT:
                if (item.Type === LedgerEntryTypes.Vault) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.VaultDeposit,
                        VaultID: item.Index,
                    });
                }
                break;
            case ActionTypes.WITHDRAW_VAULT:
                if (item.Type === LedgerEntryTypes.Vault) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.VaultWithdraw,
                        VaultID: item.Index,
                    });
                }
                break;
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
                } else if (item.Type === LedgerEntryTypes.URIToken) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.URITokenCancelSellOffer,
                        URITokenID: item.URITokenID,
                    });
                }
                break;
            case ActionTypes.ACCEPT_CREDENTIAL:
                Object.assign(craftedTxJson, {
                    TransactionType: TransactionTypes.CredentialAccept,
                    Issuer: (item as any)?.Issuer,
                    CredentialType: (item as any)?.CredentialType,
                });
                break;
            case ActionTypes.DELETE_CREDENTIAL:
                Object.assign(craftedTxJson, {
                    TransactionType: TransactionTypes.CredentialDelete,
                    Issuer: (item as any)?.Issuer,
                    CredentialType: (item as any)?.CredentialType,
                });
                break;
            case ActionTypes.CANCEL_NFTOKEN_OFFER:
                if (item.Type === LedgerEntryTypes.NFTokenOffer) {
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
                        NFTokenSellOffer: item.Flags?.lsfSellNFToken ? item.Index : undefined,
                        NFTokenBuyOffer: !item.Flags?.lsfSellNFToken ? item.Index : undefined,
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
            case ActionTypes.REMOVE_DELEGATION:
                if (item.Type === LedgerEntryTypes.Delegate) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.DelegateSet,
                        Account: item.Account,
                        Authorize: item.Authorize,
                        Permissions: [],
                    });
                }
                break;
            case ActionTypes.DELETE_MPT_ISSUANCE:
                if (item.Type === LedgerEntryTypes.MPTokenIssuance && item.Issuer === account.address) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.MPTokenIssuanceDestroy,
                        MPTokenIssuanceID: item.mpt_issuance_id,
                    });
                }
                break;
            case ActionTypes.REMOVE_PERMISSIONED_DOMAIN:
                if (item.Type === LedgerEntryTypes.PermissionedDomain && item.Owner === account.address) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.PermissionedDomainDelete,
                        Account: item.Owner,
                        DomainID: item.Index,
                    });
                }
                break;
            case ActionTypes.DELETE_DEPOSIT_PREAUTH:
                if (
                    item.Type === LedgerEntryTypes.DepositPreauth &&
                    typeof (item as any)?._object === 'object'
                ) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.DepositPreauth,
                        Account: item.Account,
                        Unauthorize: item.Authorize,
                        UnauthorizeCredentials: item.AuthorizeCredentials &&
                            item.AuthorizeCredentials.map(Credential => ({ Credential })),
                    });
                }
                break;
            case ActionTypes.REMOVE_MPT:
                if (item.Type === LedgerEntryTypes.MPToken) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.MPTokenAuthorize,
                        Account: item.Issuer,
                        MPTokenIssuanceID: item.MPTokenIssuanceID,
                        Flags: 0x0001,
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
                    const isIssuedCurrency = () => {
                        return item?.SendMax?.issuer &&
                            typeof item?.SendMax?.issuer === 'string' &&
                            item?.SendMax?.value;
                    };

                    const isNativeCurrency = () => {
                        return String(item?.SendMax?.issuer || '') === '' &&
                            item?.SendMax?.value &&
                            item?.SendMax?.currency === NetworkService.getNativeAsset();
                    };

                    if (
                        item?.SendMax &&
                        (isIssuedCurrency() || isNativeCurrency())
                    ) {
                        const transferRate = isIssuedCurrency()
                            ? await LedgerService.getAccountTransferRate(String(item?.SendMax?.issuer || ''))
                            : undefined;

                        if (transferRate) {
                            Object.assign(craftedTxJson, {
                                TransactionType: TransactionTypes.CheckCash,
                                CheckID: item.Index,
                                DeliverMin: {
                                    ...item.SendMax,
                                    value: new BigNumber(item.SendMax.value).minus(
                                        new BigNumber(item.SendMax.value).times(transferRate).dividedBy(100),
                                    ).toString(),
                                },
                            });
                        } else {
                            Object.assign(craftedTxJson, {
                                TransactionType: TransactionTypes.CheckCash,
                                CheckID: item.Index,
                            });
                        }
                    }
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
            case ActionTypes.ACCEPT_URITOKEN_OFFER:
                if (item.Type === LedgerEntryTypes.URIToken || item.Type === TransactionTypes.URITokenMint) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.URITokenBuy,
                        URITokenID: item.URITokenID,
                        Amount:
                            item.Amount!.currency === NetworkService.getNativeAsset()
                                ? new AmountParser(item.Amount!.value, false).nativeToDrops().toString()
                                : item.Amount,
                    });
                }
                break;
            case ActionTypes.DELETE_LOAN_BROKER:
                if (item.Type === LedgerEntryTypes.LoanBroker && item.Owner === account.address) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.LoanBrokerDelete,
                        LoanBrokerID: item.Index,
                    });
                }
                break;
            case ActionTypes.DEPOSIT_LOAN_BROKER_COVER:
                if (item.Type === LedgerEntryTypes.LoanBroker) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.LoanBrokerCoverDeposit,
                        LoanBrokerID: item.Index,
                    });
                }
                break;
            case ActionTypes.WITHDRAW_LOAN_BROKER_COVER:
                if (item.Type === LedgerEntryTypes.LoanBroker) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.LoanBrokerCoverWithdraw,
                        LoanBrokerID: item.Index,
                    });
                }
                break;
            case ActionTypes.DELETE_LOAN:
                if (item.Type === LedgerEntryTypes.Loan) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.LoanDelete,
                        LoanID: item.Index,
                    });
                }
                break;
            case ActionTypes.PAY_LOAN:
                if (item.Type === LedgerEntryTypes.Loan) {
                    Object.assign(craftedTxJson, {
                        TransactionType: TransactionTypes.LoanPay,
                        LoanID: item.Index,
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
        const { item } = this.props;

        if (!availableActions) {
            return null;
        }

        return availableActions.map((type, index) => {
            const key = `action-button-${index}-${(item as any)?.hash}`;

            return (
                <View key={`${key}-c`} style={[AppStyles.paddingBottomExtraSml]}>
                    <ActionButton
                        key={key}
                        actionType={type}
                        onPress={this.onActionButtonPress}
                    />
                </View>
            );
        });
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
