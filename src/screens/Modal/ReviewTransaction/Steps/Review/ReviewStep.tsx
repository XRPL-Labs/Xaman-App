/**
 * Review Step
 */

import { get } from 'lodash';
import React, { Component } from 'react';
import { ImageBackground, Text, View } from 'react-native';

import { StyleService } from '@services';

// components
import { Avatar, KeyboardAwareScrollView, SwipeButton } from '@components/General';
import { AccountElement, AccountPicker } from '@components/Modules';

import Localize from '@locale';

import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

import { ReviewHeader } from '@screens/Modal/ReviewTransaction/Shared';

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
    canScroll: boolean;
    timestamp?: number;
}

/* Component ==================================================================== */
class ReviewStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            canScroll: true,
        };
    }

    toggleCanScroll = () => {
        const { canScroll } = this.state;

        this.setState({
            canScroll: !canScroll,
        });
    };

    getSwipeButtonColor = (): string | undefined => {
        const { coreSettings } = this.context;

        if (coreSettings?.developerMode && coreSettings?.network) {
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

    getHeaderTitle = () => {
        const { transaction } = this.context;

        return transaction!.Type === PseudoTransactionTypes.SignIn
            ? Localize.t('global.signIn')
            : Localize.t('global.reviewTransaction');
    };

    renderDetails = () => {
        const { payload, transaction, source, setLoading, setReady } = this.context;

        if (!transaction) {
            return null;
        }

        const Components = [];
        const Props = {
            source,
            transaction,
            payload,
            forceRender: this.forceRender,
            setLoading,
            setReady,
        } as any;

        switch (true) {
            case transaction.Type in PseudoTransactionTypes:
                Components.push(
                    React.createElement(get(PseudoTemplates, String(transaction.Type)), {
                        ...Props,
                        key: `${transaction.Type}Template`,
                    }),
                );
                break;
            case transaction.Type in TransactionTypes:
                Components.push(
                    React.createElement(get(Templates, String(transaction.Type)), {
                        ...Props,
                        key: `${transaction!.Type}Template`,
                    }),
                );
                // also push global template
                Components.push(
                    React.createElement(get(Templates, 'Global'), {
                        ...Props,
                        key: 'GlobalTemplate',
                    }),
                );
                break;
            default:
                break;
        }

        return Components;
    };

    render() {
        const {
            accounts,
            payload,
            transaction,
            source,
            isReady,
            isLoading,
            setSource,
            onAccept,
            onClose,
            getTransactionLabel,
        } = this.context;
        const { canScroll } = this.state;

        // waiting for accounts / transaction to be initiated
        if (typeof accounts === 'undefined' || !source || !transaction) {
            return null;
        }

        return (
            <ImageBackground
                testID="review-transaction-modal"
                source={StyleService.getImage('BackgroundPattern')}
                imageStyle={styles.xamanAppBackground}
                style={styles.container}
            >
                {/* header */}
                <ReviewHeader title={this.getHeaderTitle()} onClose={onClose} />

                <KeyboardAwareScrollView
                    testID="review-content-container"
                    contentContainerStyle={styles.keyboardAvoidContainerStyle}
                    style={AppStyles.flex1}
                    scrollEnabled={canScroll}
                >
                    <View style={AppStyles.centerContent}>
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

                        {/* in multi-sign transactions and in some cases in Import transaction */}
                        {/* the Account can be different than the signing account */}

                        {transaction.Account && source.address !== transaction.Account && (
                            <View style={[AppStyles.paddingHorizontalSml, AppStyles.paddingTopSml]}>
                                <View style={styles.rowLabel}>
                                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                        {Localize.t('global.signFor')}
                                    </Text>
                                </View>
                                <AccountElement address={transaction.Account} />
                            </View>
                        )}
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
