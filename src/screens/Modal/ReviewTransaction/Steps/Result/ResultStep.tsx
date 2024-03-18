/**
 * Payload Result Screen
 */
import { get } from 'lodash';
import React, { Component, Fragment } from 'react';
import { Image, SafeAreaView, ScrollView, Text, View } from 'react-native';

import { Images } from '@common/helpers/images';
import { Toast } from '@common/helpers/interface';
import { Clipboard } from '@common/helpers/clipboard';

import { InstanceTypes } from '@common/libs/ledger/types/enums';

// components
import { Avatar, Button, Footer, Spacer } from '@components/General';
import Localize from '@locale';

// style
import { AppColors, AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
import { HexEncoding } from '@common/utils/string';
import { ExplainerFactory } from '@common/libs/ledger/factory';

/* types ==================================================================== */
export interface Props {}

export interface State {
    closeButtonLabel: string;
}

/* Component ==================================================================== */
class ResultStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props, context: React.ContextType<typeof StepsContext>) {
        super(props);

        this.state = {
            closeButtonLabel: context.payload.getReturnURL() ? Localize.t('global.next') : Localize.t('global.close'),
        };
    }

    getNormalizedErrorMessage = () => {
        const { transaction } = this.context;

        // this will never happen as Pseudo transactions never submits to the network
        if (transaction!.InstanceType === InstanceTypes.PseudoTransaction) {
            return 'Pseudo transactions should never submit to the network!';
        }

        switch (transaction!.TransactionResult?.code) {
            case 'tecPATH_PARTIAL':
                return Localize.t('errors.tecPATH_PARTIAL');
            case 'tecPATH_DRY':
                return Localize.t('errors.tecPATH_DRY');
            case 'tecHOOK_REJECTED': {
                const returnStringHex = get(transaction!.HookExecution(), '[0].HookReturnString', '');
                return Localize.t('errors.tecHOOK_REJECTED', {
                    hookReturnString: returnStringHex ? HexEncoding.toString(returnStringHex) : '',
                });
            }
            default:
                return transaction!.TransactionResult?.message || 'No Description';
        }
    };

    getTransactionLabel = () => {
        const { source, transaction } = this.context;

        const explainer = ExplainerFactory.fromInstance(transaction!, source!);

        return explainer?.getEventsLabel();
    };

    renderSuccess = () => {
        const { onFinish } = this.context;
        const { closeButtonLabel } = this.state;

        return (
            <SafeAreaView testID="success-result-view" style={[styles.container, styles.containerSuccess]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorGreen, AppStyles.textCenterAligned]}>
                        {Localize.t('send.transactionSubmittedSuccessfully')}
                    </Text>
                    <Text
                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreen, AppStyles.textCenterAligned]}
                    >
                        {this.getTransactionLabel()}
                    </Text>
                </View>

                <View style={AppStyles.flex2}>
                    <Image style={styles.successImage} source={Images.ImageSuccessCheckMark} />
                </View>

                <Footer>
                    <Button
                        testID="close-button"
                        style={{ backgroundColor: AppColors.green }}
                        onPress={onFinish}
                        label={closeButtonLabel}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderFailed = () => {
        const { transaction, onFinish } = this.context;
        const { closeButtonLabel } = this.state;

        return (
            <SafeAreaView testID="failed-result-view" style={[styles.container, styles.containerFailed]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorRed, AppStyles.textCenterAligned]}>
                        {Localize.t('send.submitFailed')}
                    </Text>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorRed, AppStyles.textCenterAligned]}>
                        {Localize.t('send.somethingWentWrong')}
                    </Text>
                </View>

                <View style={[AppStyles.flex2, styles.detailsCard, AppStyles.marginBottom]}>
                    <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.code')}:</Text>
                    <Spacer />
                    <Text style={[AppStyles.p, AppStyles.monoBold]}>{transaction!.TransactionResult?.code}</Text>

                    <Spacer />
                    <View style={AppStyles.hr} />
                    <Spacer />
                    <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                    <Spacer />

                    <ScrollView>
                        <Text style={AppStyles.subtext}>{this.getNormalizedErrorMessage()}</Text>
                    </ScrollView>

                    <Spacer size={50} />

                    <Button
                        light
                        roundedSmall
                        label={Localize.t('global.copy')}
                        style={AppStyles.stretchSelf}
                        onPress={() => {
                            Clipboard.setString(
                                // @ts-ignore
                                transaction.TransactionResult?.message || transaction.TransactionResult?.code,
                            );
                            Toast(Localize.t('send.resultCopiedToClipboard'));
                        }}
                    />
                </View>

                <Footer>
                    <Button
                        testID="close-button"
                        style={{ backgroundColor: AppColors.red }}
                        onPress={onFinish}
                        label={closeButtonLabel}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderSigned = () => {
        const { transaction, payload, onFinish } = this.context;
        const { closeButtonLabel } = this.state;

        return (
            <SafeAreaView testID="signed-result-view" style={[AppStyles.container, styles.containerSigned]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Fragment key="success">
                        <Text
                            style={[AppStyles.h3, AppStyles.strong, AppStyles.textCenterAligned, AppStyles.colorBlue]}
                        >
                            {Localize.t('send.signed')}
                        </Text>
                        <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.colorBlue]}>
                            {Localize.t('send.transactionSignedSuccessfully')}
                        </Text>
                    </Fragment>
                </View>

                <View style={AppStyles.flex3}>
                    <View style={styles.detailsCard}>
                        {transaction?.InstanceType === InstanceTypes.PseudoTransaction ? (
                            <View key="applicationDetails" style={[AppStyles.centerAligned, AppStyles.paddingVertical]}>
                                <Avatar size={70} border source={{ uri: payload.getApplicationIcon() }} />
                                {/* eslint-disable-next-line react-native/no-inline-styles */}
                                <Text style={[styles.appTitle, { marginBottom: 0 }]}>
                                    {payload.getApplicationName()}
                                </Text>
                            </View>
                        ) : (
                            transaction?.hash && (
                                <Fragment key="txID">
                                    <Text style={[AppStyles.subtext, AppStyles.bold]}>
                                        {Localize.t('send.transactionID')}
                                    </Text>
                                    <Spacer />
                                    <Text style={AppStyles.subtext}>{transaction.hash}</Text>

                                    <Spacer size={50} />
                                    <Button
                                        light
                                        roundedSmall
                                        label={Localize.t('global.copy')}
                                        style={AppStyles.stretchSelf}
                                        onPress={() => {
                                            Clipboard.setString(transaction.hash!);
                                            Toast(Localize.t('send.txIdCopiedToClipboard'));
                                        }}
                                    />
                                </Fragment>
                            )
                        )}
                    </View>
                </View>

                <Footer>
                    <Button onPress={onFinish} label={closeButtonLabel} />
                </Footer>
            </SafeAreaView>
        );
    };

    renderVerificationFailed = () => {
        const { onFinish } = this.context;
        const { closeButtonLabel } = this.state;

        return (
            <SafeAreaView
                testID="verification-failed-result-view"
                style={[styles.container, styles.containerVerificationFailed]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorOrange, AppStyles.textCenterAligned]}>
                        {Localize.t('send.verificationFailed')}
                    </Text>
                    <Text
                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorOrange, AppStyles.textCenterAligned]}
                    >
                        {Localize.t('send.couldNotVerifyTransaction')}
                    </Text>
                </View>

                <View style={AppStyles.flex2}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                        <Spacer />
                        <Text style={AppStyles.subtext}>{Localize.t('send.verificationFailedDescription')}</Text>
                    </View>
                </View>

                <Footer>
                    <Button onPress={onFinish} label={closeButtonLabel} style={{ backgroundColor: AppColors.orange }} />
                </Footer>
            </SafeAreaView>
        );
    };

    render() {
        const { submitResult, transaction } = this.context;

        if (!submitResult || transaction!.InstanceType === InstanceTypes.PseudoTransaction) {
            return this.renderSigned();
        }

        if (transaction!.TransactionResult?.success) {
            // submitted successfully but cannot verify
            if (transaction!.VerifyResult?.success === false) {
                return this.renderVerificationFailed();
            }
            return this.renderSuccess();
        }

        return this.renderFailed();
    }
}

/* Export Component ==================================================================== */
export default ResultStep;
