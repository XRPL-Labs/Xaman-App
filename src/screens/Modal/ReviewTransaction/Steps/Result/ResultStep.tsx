/**
 * Send Result Screen
 */

import React, { Component, Fragment } from 'react';
import { SafeAreaView, View, Text, Image } from 'react-native';

import Clipboard from '@react-native-community/clipboard';

import { Images } from '@common/helpers/images';
import { Toast } from '@common/helpers/interface';

// components
import { Button, Footer, Spacer } from '@components/General';
import Localize from '@locale';
// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class ResultStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    renderSuccess = () => {
        const { payload, onFinish, getTransactionLabel } = this.context;

        return (
            <SafeAreaView testID="success-result-view" style={[styles.container, styles.containerSuccess]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Text style={[AppStyles.h3, AppStyles.strong, AppStyles.colorGreen, AppStyles.textCenterAligned]}>
                        {Localize.t('send.transactionSubmittedSuccessfully')}
                    </Text>
                    <Text
                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreen, AppStyles.textCenterAligned]}
                    >
                        {getTransactionLabel()}
                    </Text>
                </View>

                <View style={[AppStyles.flex2]}>
                    <Image style={styles.successImage} source={Images.ImageSuccessCheckMark} />
                </View>

                <Footer style={[]}>
                    <Button
                        testID="close-button"
                        style={{ backgroundColor: AppColors.green }}
                        onPress={onFinish}
                        label={payload.meta.return_url_app ? Localize.t('global.next') : Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderFailed = () => {
        const { transaction, payload, onFinish } = this.context;

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

                <View style={[AppStyles.flex2]}>
                    <View style={styles.detailsCard}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.code')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.p, AppStyles.monoBold]}>{transaction.TransactionResult?.code}</Text>

                        <Spacer />
                        <View style={AppStyles.hr} />
                        <Spacer />
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>{Localize.t('global.description')}:</Text>
                        <Spacer />
                        <Text style={[AppStyles.subtext]}>
                            {transaction.TransactionResult?.message || 'No Description'}
                        </Text>

                        <Spacer size={50} />

                        <Button
                            light
                            roundedSmall
                            label={Localize.t('global.copy')}
                            style={AppStyles.stretchSelf}
                            onPress={() => {
                                Clipboard.setString(
                                    transaction.TransactionResult?.message || transaction.TransactionResult?.code,
                                );
                                Toast(Localize.t('send.resultCopiedToClipboard'));
                            }}
                        />
                    </View>
                </View>

                <Footer style={[]}>
                    <Button
                        testID="close-button"
                        style={{ backgroundColor: AppColors.red }}
                        onPress={onFinish}
                        label={payload.meta.return_url_app ? Localize.t('global.next') : Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    renderSigned = () => {
        const { transaction, payload, onFinish } = this.context;

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

                <View style={[AppStyles.flex3]}>
                    <View style={styles.detailsCard}>
                        {transaction.Hash && (
                            <Fragment key="txID">
                                <Text style={[AppStyles.subtext, AppStyles.bold]}>
                                    {Localize.t('send.transactionID')}
                                </Text>
                                <Spacer />
                                <Text style={[AppStyles.subtext]}>{transaction.Hash}</Text>

                                <Spacer size={50} />
                                <Button
                                    light
                                    roundedSmall
                                    label={Localize.t('global.copy')}
                                    style={AppStyles.stretchSelf}
                                    onPress={() => {
                                        Clipboard.setString(transaction.Hash);
                                        Toast(Localize.t('send.txIdCopiedToClipboard'));
                                    }}
                                />
                            </Fragment>
                        )}
                    </View>
                </View>

                <Footer>
                    <Button
                        onPress={onFinish}
                        label={payload.meta.return_url_app ? Localize.t('global.next') : Localize.t('global.close')}
                    />
                </Footer>
            </SafeAreaView>
        );
    };

    render() {
        const { submitResult } = this.context;

        if (!submitResult) {
            return this.renderSigned();
        }

        if (submitResult.success) {
            return this.renderSuccess();
        }

        return this.renderFailed();
    }
}

/* Export Component ==================================================================== */
export default ResultStep;
