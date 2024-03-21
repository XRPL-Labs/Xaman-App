/**
 * Request decline overlay
 */
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, ActionPanel } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onDecline: () => void;
    onClose: () => void;
}

export interface State {}

/* Component ==================================================================== */
class RequestDeclineOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.RequestDecline;

    private readonly actionPanel: React.RefObject<ActionPanel>;

    constructor(props: Props) {
        super(props);

        this.actionPanel = React.createRef();
    }

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    onClose = async () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        // close overlay
        await Navigator.dismissOverlay();
    };

    onDecline = async () => {
        const { onDecline } = this.props;

        if (typeof onDecline === 'function') {
            onDecline();
        }
        // close overlay
        await Navigator.dismissOverlay();
    };

    render() {
        return (
            <ActionPanel
                height={AppSizes.moderateScale(380)}
                onSlideDown={Navigator.dismissOverlay}
                extraBottomInset
                ref={this.actionPanel}
            >
                <View style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingVerticalSml]}>
                    <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                        {Localize.t('payload.whatDoYouWantToDo')}
                    </Text>
                </View>
                <View style={[AppStyles.flex1, AppStyles.paddingHorizontalSml]}>
                    <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                        <Text style={[AppStyles.bold, AppStyles.colorGrey]}>{Localize.t('global.close')} </Text>
                        {Localize.t('payload.willIgnoreTheRequestAndClose')}{' '}
                        <Text style={[AppStyles.bold, AppStyles.colorRed]}>{Localize.t('global.decline')} </Text>
                        {Localize.t('payload.willRejectTheSignRequest')}
                    </Text>
                </View>
                <View style={[AppStyles.flex2, AppStyles.paddingHorizontalSml]}>
                    <Button secondary numberOfLines={1} onPress={this.onClose} label={Localize.t('global.close')} />
                    <Spacer size={20} />
                    <Button
                        onPress={this.onDecline}
                        style={styles.declineButton}
                        label={Localize.t('global.decline')}
                        icon="IconTrash"
                    />
                </View>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default RequestDeclineOverlay;
