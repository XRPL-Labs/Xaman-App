/**
 * Review Step
 */

import { filter, find, first, get, isEmpty } from 'lodash';
import React, { Component } from 'react';
import { ImageBackground, InteractionManager, Text, View } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { StyleService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel } from '@store/models';

// components
import { Avatar, Button, KeyboardAwareScrollView, Spacer, SwipeButton } from '@components/General';
import { AccountPicker } from '@components/Modules';

import Localize from '@locale';

import { BaseTransaction } from '@common/libs/ledger/transactions';
import { BasePseudoTransaction } from '@common/libs/ledger/transactions/pseudo';

import { PseudoTransactionTypes } from '@common/libs/ledger/types';

// style
import { AppStyles } from '@theme';

// transaction templates
import * as Templates from './Templates';
import * as PseudoTemplates from './Templates/pseudo';

import { StepsContext } from '../../Context';

import styles from './styles';
/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Array<AccountModel>;
    canScroll: boolean;
    timestamp?: number;
}

/* Component ==================================================================== */
class ReviewStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            accounts: undefined,
            canScroll: true,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setAccounts);
    }

    setAccounts = () => {
        const { transaction, payload, setSource, setError } = this.context;

        // get available accounts for signing
        let availableAccounts = [] as AccountModel[];

        if (payload.isMultiSign()) {
            // only accounts with full access
            availableAccounts = AccountRepository.getFullAccessAccounts();
        } else if (payload.isPseudoTransaction()) {
            // account's that can sign the transaction
            availableAccounts = AccountRepository.getSignableAccounts();
        } else {
            // account's that can sign the transaction and also activated
            availableAccounts = AccountRepository.getSpendableAccounts(true);
        }

        // if no account for signing is available then just return
        if (isEmpty(availableAccounts)) {
            this.setState({
                accounts: [],
            });
            return;
        }

        // choose preferred account for sign
        let preferredAccount = undefined as AccountModel;
        let source = undefined as AccountModel;

        // check for enforced signer accounts
        const forcedSigners = payload.getSigners();

        if (forcedSigners) {
            // filter available accounts base on forced signers
            availableAccounts = filter(availableAccounts, (account) => forcedSigners.includes(account.address));

            // no available account for signing base on forced signers
            if (isEmpty(availableAccounts)) {
                setError(
                    Localize.t('payload.forcedSignersAccountsDoesNotExist', { accounts: forcedSigners.join('\n') }),
                );
                return;
            }
        }

        // if any account set from payload, set as preferred account
        if (transaction.Account) {
            preferredAccount = find(availableAccounts, { address: transaction.Account.address });
        }

        // remove hidden accounts but keep preferred account even if hidden
        // ignore for forced signers
        if (!forcedSigners) {
            availableAccounts = filter(
                availableAccounts,
                (account) => !account.hidden || account.address === preferredAccount?.address,
            );
        }

        // after removing the hidden accounts
        // return if empty
        if (isEmpty(availableAccounts)) {
            this.setState({
                accounts: [],
            });
            return;
        }

        // if there is no preferred account base on transaction.Account
        // choose default || first available account
        // this will guarantee source to be set
        if (preferredAccount) {
            source = preferredAccount;
        } else {
            const defaultAccount = CoreRepository.getDefaultAccount();
            source = find(availableAccounts, { address: defaultAccount.address }) || first(availableAccounts);
        }

        // set the source
        setSource(source);

        // set available accounts
        this.setState({
            accounts: availableAccounts,
        });
    };

    toggleCanScroll = () => {
        const { canScroll } = this.state;

        this.setState({
            canScroll: !canScroll,
        });
    };

    getSwipeButtonColor = (): string => {
        const { coreSettings } = this.context;

        if (coreSettings.developerMode) {
            return coreSettings.network.color;
        }

        return undefined;
    };

    forceRender = () => {
        this.setState({
            // eslint-disable-next-line react/no-unused-state
            timestamp: +new Date(),
        });
    };

    renderDetails = () => {
        const { payload, transaction, source, setLoading, setReady } = this.context;

        const Components = [];
        const Props = {
            source,
            transaction,
            payload,
            forceRender: this.forceRender,
            setLoading,
            setReady,
        };

        switch (true) {
            case transaction instanceof BasePseudoTransaction:
                Components.push(
                    React.createElement(get(PseudoTemplates, String(transaction.Type)), {
                        ...Props,
                        key: `${transaction.Type}Template`,
                    }),
                );
                break;
            case transaction instanceof BaseTransaction:
                Components.push(
                    React.createElement(get(Templates, String(transaction.Type)), {
                        ...Props,
                        key: `${transaction.Type}Template`,
                    }),
                );
                // @ts-ignore
                Components.push(React.createElement(get(Templates, 'Global'), { ...Props, key: 'GlobalTemplate' }));
                break;
            default:
                break;
        }

        return Components;
    };

    renderEmptyOverlay = () => {
        const { onClose } = this.context;

        return (
            <ImageBackground
                testID="review-transaction-modal"
                source={StyleService.getImage('BackgroundPattern')}
                imageStyle={styles.xummAppBackground}
                style={styles.container}
            >
                <View style={styles.blurView}>
                    <View style={styles.absolute}>
                        <View style={styles.headerContainer}>
                            <View style={[AppStyles.row]}>
                                <View style={[AppStyles.flex1, AppStyles.leftAligned]}>
                                    <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                        {Localize.t('global.reviewTransaction')}
                                    </Text>
                                </View>
                                <View style={AppStyles.rightAligned}>
                                    <Button
                                        contrast
                                        testID="close-button"
                                        numberOfLines={1}
                                        roundedSmall
                                        label={Localize.t('global.close')}
                                        onPress={onClose}
                                    />
                                </View>
                            </View>
                        </View>
                        <View
                            style={[
                                AppStyles.flex1,
                                AppStyles.centerContent,
                                AppStyles.centerAligned,
                                AppStyles.paddingSml,
                            ]}
                        >
                            <Text style={AppStyles.h5}>{Localize.t('global.noAccountConfigured')}</Text>
                            <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                {Localize.t('global.pleaseAddAccountToSignTheTransaction')}
                            </Text>
                            <Spacer size={20} />
                            <Button
                                testID="add-account-button"
                                label={Localize.t('home.addAccount')}
                                icon="IconPlus"
                                iconStyle={AppStyles.imgColorWhite}
                                rounded
                                onPress={async () => {
                                    await Navigator.dismissModal();
                                    Navigator.push(AppScreens.Account.Add);
                                }}
                            />
                            <Spacer size={40} />
                        </View>
                    </View>
                </View>
            </ImageBackground>
        );
    };

    render() {
        const { accounts, canScroll } = this.state;

        const { payload, transaction, source, isReady, isLoading, setSource, onAccept, onClose, getTransactionLabel } =
            this.context;

        // no account is available for signing
        if (Array.isArray(accounts) && accounts.length === 0) {
            return this.renderEmptyOverlay();
        }

        // waiting for accounts to be initiated
        if (typeof accounts === 'undefined' || !source) {
            return null;
        }

        return (
            <ImageBackground
                testID="review-transaction-modal"
                source={StyleService.getImage('BackgroundPattern')}
                imageStyle={styles.xummAppBackground}
                style={styles.container}
            >
                {/* header */}
                <View style={styles.headerContainer}>
                    <View style={AppStyles.row}>
                        <View style={[AppStyles.flex1, AppStyles.leftAligned, AppStyles.paddingRightSml]}>
                            <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                {transaction.Type === PseudoTransactionTypes.SignIn
                                    ? Localize.t('global.signIn')
                                    : Localize.t('global.reviewTransaction')}
                            </Text>
                        </View>
                        <View style={AppStyles.rightAligned}>
                            <Button
                                contrast
                                testID="close-button"
                                numberOfLines={1}
                                roundedSmall
                                label={Localize.t('global.close')}
                                onPress={onClose}
                            />
                        </View>
                    </View>
                </View>
                <KeyboardAwareScrollView
                    testID="review-content-container"
                    contentContainerStyle={styles.keyboardAvoidContainerStyle}
                    style={AppStyles.flex1}
                    scrollEnabled={canScroll}
                >
                    <View style={[AppStyles.centerContent]}>
                        <View style={[AppStyles.row, AppStyles.paddingSml]}>
                            <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                                <Avatar size={60} border source={{ uri: payload.getApplicationIcon() }} />

                                <Text style={styles.appTitle}>{payload.getApplicationName()}</Text>

                                {!!payload.getCustomInstruction() && (
                                    <>
                                        <Text style={styles.descriptionLabel}>{Localize.t('global.details')}</Text>
                                        <Text style={styles.instructionText}>{payload.getCustomInstruction()}</Text>
                                    </>
                                )}

                                {transaction.Type !== PseudoTransactionTypes.SignIn && (
                                    <>
                                        <Text style={styles.descriptionLabel}>{Localize.t('global.type')}</Text>
                                        <Text style={[styles.instructionText, AppStyles.colorBlue, AppStyles.bold]}>
                                            {getTransactionLabel()}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.transactionContent}>
                        <View style={AppStyles.paddingHorizontalSml}>
                            <View style={styles.rowLabel}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                    {payload.isPseudoTransaction() || payload.isMultiSign()
                                        ? Localize.t('global.signAs')
                                        : Localize.t('global.signWith')}
                                </Text>
                            </View>
                            <AccountPicker onSelect={setSource} accounts={accounts} selectedItem={source} />
                        </View>

                        <View style={[AppStyles.paddingHorizontalSml, AppStyles.paddingVerticalSml]}>
                            {this.renderDetails()}
                        </View>
                        <View style={[styles.acceptButtonContainer, AppStyles.paddingHorizontalSml]}>
                            <SwipeButton
                                testID="accept-button"
                                color={this.getSwipeButtonColor()}
                                isLoading={isLoading}
                                isDisabled={!isReady}
                                onSwipeSuccess={onAccept}
                                label={Localize.t('global.slideToAccept')}
                                accessibilityLabel={Localize.t('global.accept')}
                                onPanResponderGrant={this.toggleCanScroll}
                                onPanResponderRelease={this.toggleCanScroll}
                                shouldResetAfterSuccess
                            />
                        </View>
                    </View>
                </KeyboardAwareScrollView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewStep;
