/**
 * Help Modal
 */

import React, { Component } from 'react';
import { View, Text, ImageBackground, BackHandler, ScrollView, NativeEventSubscription } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import { Button } from '@components/General/Button';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    content: string;
    title: string;
}

export interface State {}

/* Component ==================================================================== */
class HelpModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.Help;

    private backHandler: NativeEventSubscription | undefined;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    onClose = () => {
        Navigator.dismissModal();
        return true;
    };

    render() {
        const { content, title } = this.props;

        return (
            <ImageBackground
                imageStyle={styles.backgroundImageStyle}
                style={styles.container}
                source={Images.IconHelpCircle}
            >
                <View style={[AppStyles.row, AppStyles.paddingTop]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                        <Text style={AppStyles.h5}>{title}</Text>
                    </View>
                    <View style={[AppStyles.paddingRightSml, AppStyles.rightAligned, AppStyles.centerContent]}>
                        <Button
                            onPress={() => {
                                Navigator.dismissModal();
                            }}
                            roundedSmall
                            light
                            label={Localize.t('global.close').toUpperCase()}
                        />
                    </View>
                </View>

                <ScrollView bounces={false} style={AppStyles.padding} contentContainerStyle={[AppStyles.flex1]}>
                    <Text style={AppStyles.p}>{content}</Text>
                </ScrollView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default HelpModal;
