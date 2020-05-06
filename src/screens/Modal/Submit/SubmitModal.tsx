/**
 * Submit Modal
 * Modal to submit the transaction to the ledger
 * and show status of submitting the transaction to the ledger
 */

import React, { Component, Fragment } from 'react';
import { View, Text, SafeAreaView, Image, Clipboard, InteractionManager, BackHandler } from 'react-native';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

import Submitter from '@common/libs/ledger/submitter';
import { SubmitResultType, VerifyResultType } from '@common/libs/ledger/types';

// components
import { Footer, Button, Icon, Spacer } from '@components';

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

    private backHandler: any;

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

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        InteractionManager.runAfterInteractions(() => {
            this.submit();
        });
    }

    submit = async () => {
        const { txblob } = this.props;

        const ledgerSubmitter = new Submitter(txblob);

        const submitResult = await ledgerSubmitter.submit();

        // submitted verify
        if (submitResult.success) {
            this.setState({ step: 'verifying', submitResult });

            const verifyResult = await Submitter.verify(submitResult.transactionId);

            this.setState({
                step: 'result',
                verifyResult,
            });
        } else {
            this.setState({
                step: 'result',
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
            <SafeAreaView style={[AppStyles.container, AppStyles.paddingSml, { backgroundColor: AppColors.light }]}>
                <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                    <Image style={styles.backgroundImageStyle} source={Images.IconSend} />
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
                        <Image style={styles.loaderStyle} source={require('@common/assets/loader.gif')} />
                        <Spacer size={20} />
                        <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                            {Localize.t('send.submittingToLedger')}
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
                style={[
                    AppStyles.container,
                    { backgroundColor: verifyResult.success ? AppColors.lightGreen : AppColors.lightRed },
                ]}
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
