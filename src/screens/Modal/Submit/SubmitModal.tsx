/**
 * Submit Modal
 * Modal to submit the transaction to the ledger
 * and show status of submitting the transaction to the ledger
 */

import React, { Component, Fragment } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    Image,
    InteractionManager,
    BackHandler,
    NativeEventSubscription,
} from 'react-native';

import { AppScreens } from '@common/constants';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Clipboard } from '@common/helpers/clipboard';

import { LedgerService, StyleService, NetworkService } from '@services';
import { SubmitResultType, VerifyResultType } from '@common/libs/ledger/types';

// components
import { Footer, Button, Icon, Spacer, LoadingIndicator } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    txblob: string;
}

export interface State {
    step: 'submitting' | 'verifying' | 'result';
    submitResult: SubmitResultType;
    verifyResult: VerifyResultType;
}

/* Component ==================================================================== */
class SubmitModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.Submit;

    private backHandler: NativeEventSubscription;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            step: 'submitting',
            submitResult: undefined,
            verifyResult: undefined,
        };
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        InteractionManager.runAfterInteractions(() => {
            this.submit();
        });
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    submit = async () => {
        const { txblob } = this.props;

        const submitResult = await LedgerService.submitTransaction(txblob);

        // submitted verify
        if (submitResult.success) {
            this.setState({ step: 'verifying', submitResult });

            const verifyResult = await LedgerService.verifyTransaction(submitResult.hash);

            this.setState({
                step: 'result',
                verifyResult,
            });
        } else {
            this.setState({
                step: 'result',
                submitResult,
                verifyResult: { success: false },
            });
        }
    };

    handleClose = () => {
        Navigator.dismissModal();
    };

    renderSubmitting = () => {
        const { step } = this.state;
        return (
            <SafeAreaView style={[AppStyles.container, AppStyles.paddingSml]}>
                <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                    <Image style={styles.backgroundImageStyle} source={StyleService.getImage('IconSend')} />
                </View>

                <View style={[AppStyles.flex4]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        {step === 'submitting' ? (
                            <Text style={[AppStyles.h4, AppStyles.textCenterAligned]}>
                                {step === 'submitting' ? Localize.t('send.sending') : Localize.t('send.verifying')}
                            </Text>
                        ) : (
                            <Text style={[AppStyles.h5, AppStyles.textCenterAligned, AppStyles.colorGreen]}>
                                {Localize.t('send.sent')}{' '}
                                <Icon name="IconCheck" size={20} style={AppStyles.imgColorGreen} />
                            </Text>
                        )}

                        <Spacer size={10} />
                        {step === 'verifying' && (
                            <Text style={[AppStyles.h4, AppStyles.textCenterAligned]}>
                                {Localize.t('send.verifying')}
                            </Text>
                        )}
                    </View>
                    <View style={[AppStyles.flex2]}>
                        <LoadingIndicator size="large" />
                        <Spacer size={20} />
                        <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                            {Localize.t('send.submittingToLedger', { network: NetworkService.getNetwork().name })}
                        </Text>
                        <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                            {Localize.t('global.thisMayTakeFewSeconds')}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    };

    renderResult = () => {
        const { verifyResult, submitResult } = this.state;

        return (
            <SafeAreaView
                testID="result-view"
                style={[AppStyles.container, verifyResult.success ? styles.containerSuccess : styles.containerFailed]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.centerContent]}>
                    {verifyResult.success ? (
                        <Fragment key="success">
                            <Text
                                style={[
                                    AppStyles.h3,
                                    AppStyles.strong,
                                    AppStyles.colorGreen,
                                    AppStyles.textCenterAligned,
                                ]}
                            >
                                {Localize.t('send.submittingDone')}
                            </Text>
                            <Text
                                style={[AppStyles.p, AppStyles.bold, AppStyles.colorGreen, AppStyles.textCenterAligned]}
                            >
                                {Localize.t('send.transactionSubmittedSuccessfully')}
                            </Text>
                        </Fragment>
                    ) : (
                        <Fragment key="failed">
                            <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorRed]}>
                                {Localize.t('send.submitFailed')}
                            </Text>
                            <Text
                                style={[AppStyles.p, AppStyles.bold, AppStyles.colorRed, AppStyles.textCenterAligned]}
                            >
                                {Localize.t('send.somethingWentWrong')}
                            </Text>
                        </Fragment>
                    )}
                </View>

                <View style={[AppStyles.flex3]}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.code')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.p, AppStyles.monoBold]}>{submitResult.engineResult || '-'}</Text>

                        <Spacer />
                        <View style={AppStyles.hr} />
                        <Spacer />
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                        <Spacer />

                        <Text style={[AppStyles.subtext]}>{submitResult.message.toString()}</Text>
                        <Spacer />

                        {verifyResult.transaction && (
                            <>
                                <View style={AppStyles.hr} />
                                <Spacer />

                                <Text style={[AppStyles.subtext, AppStyles.bold]}>
                                    {Localize.t('send.transactionID')}:
                                </Text>
                                <Spacer />
                                <Text style={[AppStyles.subtext]}>{verifyResult.transaction.hash}</Text>

                                <Spacer size={50} />
                                <Button
                                    secondary
                                    roundedSmall
                                    label={Localize.t('global.copy')}
                                    style={AppStyles.stretchSelf}
                                    onPress={() => {
                                        Clipboard.setString(verifyResult.transaction.hash);
                                        Toast(Localize.t('send.txIdCopiedToClipboard'));
                                    }}
                                />
                            </>
                        )}
                    </View>
                </View>

                <Footer>
                    <Button
                        onPress={this.handleClose}
                        style={{ backgroundColor: verifyResult.success ? AppColors.green : AppColors.red }}
                        label={Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    render() {
        const { step } = this.state;

        if (step === 'submitting' || step === 'verifying') {
            return this.renderSubmitting();
        }

        return this.renderResult();
    }
}

/* Export Component ==================================================================== */
export default SubmitModal;
