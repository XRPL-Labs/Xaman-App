/**
 * Setup Disclaimers Screen
 */

import React, { Component } from 'react';

import { View, SafeAreaView, Image, Text, Platform, LayoutAnimation } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import StyleService from '@services/StyleService';

import Localize from '@locale';

// component
import { Footer, NumberSteps, Spacer, ProgressBar, CheckBox } from '@components/General';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isProgressing: boolean;
    agreed: boolean;
    currentStep: number;
}

/* Component ==================================================================== */
class DisclaimersView extends Component<Props, State> {
    static screenName = AppScreens.Setup.Disclaimers;

    private progressBar: ProgressBar;

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
            isProgressing: true,
            agreed: false,
            currentStep: 0,
        };
    }

    componentDidMount() {
        this.startProgress();
    }

    startProgress = () => {
        this.setState({
            isProgressing: true,
            agreed: false,
        });

        const waitTime = __DEV__ ? 1000 : 10000;

        this.progressBar.fill(waitTime, () => {
            this.setState({
                isProgressing: false,
            });
        });
    };

    onStepChange = (index: number) => {
        this.setState({
            currentStep: index,
        });
    };

    onAgreePress = () => {
        const { currentStep } = this.state;

        this.setState({
            agreed: true,
        });

        if (currentStep === 6) {
            Navigator.push(AppScreens.Setup.Finish);
            return;
        }

        setTimeout(() => {
            if (Platform.OS === 'ios') {
                LayoutAnimation.easeInEaseOut();
            }

            this.setState(
                {
                    currentStep: currentStep + 1,
                },
                this.startProgress,
            );
        }, 1000);
    };

    getStepContent = () => {
        const { currentStep } = this.state;

        switch (currentStep) {
            case 0:
                return {
                    title: Localize.t('setupTermOfService.XUMMIsNonCustodial'),
                    content: Localize.t('setupTermOfService.XUMMNotCustodialExplain'),
                    button: undefined,
                };
            case 1:
                return {
                    title: Localize.t('setupTermOfService.keepYourSecretsSafe'),
                    content: Localize.t('setupTermOfService.KeepYourSecretsSafeExplain'),
                    button: Localize.t('setupTermOfService.IWillKeepMySecretsSafeAndOffline'),
                };
            case 2:
                return {
                    title: Localize.t('setupTermOfService.transactionsArePermanent'),
                    content: Localize.t('setupTermOfService.transactionsArePermanentExplain'),
                    button: Localize.t('setupTermOfService.iAmResponsibleForKeepingMyKeysAndFundsSafe'),
                };
            case 3:
                return {
                    title: Localize.t('setupTermOfService.yourFundsLiveOnTheXRPLedger'),
                    content: Localize.t('setupTermOfService.yourFundsLiveOnTheXRPLedgerExplain'),
                    button: Localize.t('setupTermOfService.myFundsAreRegisteredOnTheXRPLedger'),
                };
            case 4:
                return {
                    title: Localize.t('setupTermOfService.neverShareYourSecret'),
                    content: Localize.t('setupTermOfService.neverShareYourSecretExplain'),
                    button: Localize.t('setupTermOfService.IWillNeverGiveMySecretsToAnyone'),
                };
            case 5:
                return {
                    title: Localize.t('setupTermOfService.whenYouChangeYourPhone'),
                    content: Localize.t('setupTermOfService.whenYouChangeYourPhoneExplain'),
                    button: Localize.t('setupTermOfService.IWillKeepMySecretsSafeSoICanReEnterThemIfIGetANewPhone'),
                };
            case 6:
                return {
                    title: Localize.t('setupTermOfService.questionsAndSupport'),
                    content: Localize.t('setupTermOfService.questionsAndSupportExplain'),
                    button: Localize.t('setupTermOfService.IOnlyTrustAnswersFromXUMMSupportTeam'),
                };
            default:
                return {};
        }
    };

    render() {
        const { currentStep, isProgressing, agreed } = this.state;

        const content = this.getStepContent();

        return (
            <SafeAreaView testID="disclaimers-setup-screen" style={[styles.container]}>
                <View style={[AppStyles.centerContent, AppStyles.centerAligned]}>
                    <Image style={styles.logo} source={StyleService.getImage('XummLogo')} />
                </View>

                <Spacer size={20} />
                <NumberSteps currentStep={currentStep} length={7} onStepChange={this.onStepChange} />

                <View testID="disclaimer-content-view" style={[styles.contentContainer]}>
                    <Text style={AppStyles.h5}>
                        {currentStep + 1}. {content.title}
                    </Text>
                    <Spacer size={10} />
                    <Text style={AppStyles.subtext}>{content.content}</Text>
                </View>

                <Footer style={[styles.footerStyle]}>
                    <ProgressBar
                        ref={(r) => {
                            this.progressBar = r;
                        }}
                        visible={isProgressing}
                        style={[styles.progressBar]}
                    />
                    <View style={[styles.footerContent]}>
                        {isProgressing ? (
                            <Text
                                style={[
                                    AppStyles.subtext,
                                    AppStyles.strong,
                                    AppStyles.colorBlue,
                                    AppStyles.textCenterAligned,
                                ]}
                            >
                                {Localize.t('setupTermOfService.pleaseReadTheTextAboveCarefully')}
                            </Text>
                        ) : (
                            <CheckBox
                                testID="agree-check-box"
                                checked={agreed}
                                onPress={this.onAgreePress}
                                label={Localize.t('global.IUnderstand')}
                                description={content.button}
                            />
                        )}
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default DisclaimersView;
