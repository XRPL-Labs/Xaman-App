/**
 * Help Modal
 */

import React, { Component } from 'react';
import { View, Text, ImageBackground, BackHandler } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator, Images } from '@common/helpers';

import { Button } from '@components/Button';

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
class HelpView extends Component<Props, State> {
    static screenName = AppScreens.Modal.Help;

    private backHandler: any;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);
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
                            icon="IconX"
                            iconStyle={AppStyles.imgColorBlue}
                        />
                    </View>
                </View>

                <View style={[AppStyles.flex1, AppStyles.padding]}>
                    <Text style={AppStyles.p}>{content}</Text>
                </View>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default HelpView;
