/**
 * Send Submitting Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Image, LayoutAnimation } from 'react-native';

import { Spacer, Icon } from '@components';

import { Images } from '@common/helpers';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class SubmittingStep extends Component<Props, State> {
    static contextType = StepsContext;
    context!: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);
    }

    render() {
        const { currentStep } = this.context;

        if (currentStep === 'Verifying') {
            LayoutAnimation.spring();
        }

        return (
            <SafeAreaView style={[styles.container, AppStyles.paddingSml]}>
                <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                    <Image style={styles.backgroundImageStyle} source={Images.IconSend} />
                </View>

                <View style={[AppStyles.flex4]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        {currentStep === 'Submitting' ? (
                            <Text style={[AppStyles.h4, AppStyles.textCenterAligned]}>
                                {currentStep === 'Submitting'
                                    ? Localize.t('send.sending')
                                    : Localize.t('send.verifying')}
                            </Text>
                        ) : (
                            <Text style={[AppStyles.h5, AppStyles.textCenterAligned, AppStyles.colorGreen]}>
                                {Localize.t('send.sent')}{' '}
                                <Icon name="IconCheck" size={20} style={AppStyles.imgColorGreen} />
                            </Text>
                        )}

                        <Spacer size={10} />
                        {currentStep === 'Verifying' && (
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
    }
}

/* Export Component ==================================================================== */
export default SubmittingStep;
