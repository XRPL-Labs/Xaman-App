/**
 * Import Account/secretType Step
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

import { Button, RadioButton, Footer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

import { StepsContext } from '../../Context';
import { EncryptionLevels } from '@store/types';
import { Navigator } from '@common/helpers/navigator';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class DegenModeStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    goNext = () => {
        const { goNext, degenMode, setEncryptionLevel } = this.context;

        if (degenMode) {
            Navigator.showAlertModal({
                type: 'warning',
                text: Localize.t('account.degenModeExplanationConfirm'),
                buttons: [
                    {
                        text: Localize.t('global.cancel'),
                        type: 'dismiss',
                        light: false,
                    },
                    {
                        text: Localize.t('account.degenModeProceedBtn'),
                        onPress: () => {
                            setEncryptionLevel(EncryptionLevels.Passcode, () => { 
                                goNext();
                            });
                        },
                        type: 'continue',
                        light: true,
                    },
                ],
            });
        } else {
            goNext('SeedExplanation');
        }
    };

    render() {
        const { goBack, degenMode, setDegenMode } = this.context;

        return (
            <SafeAreaView testID="account-import-secret-type-view" style={AppStyles.contentContainer}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.degenModeExplanation1')}
                </Text>

                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        lessVerticalPadding
                        testID="family-seed-radio-button"
                        onPress={() => setDegenMode(false)} 
                        label={Localize.t('account.safeMode')}
                        value='SAFE'
                        description={Localize.t('account.imSmartPerson')}
                        checked={!degenMode}
                    />

                    <Text style={[
                        AppStyles.p,
                        // AppStyles.marginTop,
                        AppStyles.marginBottomSml,
                        AppStyles.textCenterAligned,
                        AppStyles.paddingHorizontal,
                        // AppStyles.smalltext,
                        // AppStyles.baseText,
                        AppStyles.subtext,
                        degenMode && AppStyles.colorRed,
                    ]}>
                        {Localize.t('account.degenModeExplanation2')}
                    </Text>                    
                    
                    <RadioButton
                        danger
                        lessVerticalPadding
                        testID="secret-numbers-radio-button"
                        onPress={() => setDegenMode(true)} 
                        value='DEGEN'
                        label={Localize.t('account.degenMode')}
                        description={Localize.t('account.imRetard')}
                        checked={degenMode}
                    />
                </View>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default DegenModeStep;
