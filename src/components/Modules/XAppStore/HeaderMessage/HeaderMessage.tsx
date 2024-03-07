import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { InteractionManager, Text, View, ViewStyle } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import Preferences from '@common/libs/preferences';

import { XAppOrigin } from '@common/libs/payload';

import { Icon, TouchableDebounce } from '@components/General';

import { AppItem, AppType, AppActions } from '@components/Modules/XAppStore/AppsList/AppItem';

import { XAppBrowserModalProps } from '@screens/Modal/XAppBrowser';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export type MessageType = {
    id: number;
    title: string;
    content: string;
    app: AppType;
};

interface Props {
    visible: boolean;
    message?: MessageType;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    message?: MessageType;
    showMessage: boolean;
}
/* Component ==================================================================== */
class HeaderMessage extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            message: undefined,
            showMessage: false,
        };
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
        const { visible } = this.props;
        const { message, showMessage } = this.state;

        return (
            !isEqual(nextState.message, message) ||
            !isEqual(nextState.showMessage, showMessage) ||
            !isEqual(nextProps.visible, visible)
        );
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.checkShouldShowMessage);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const { message } = this.state;
        if (!isEqual(prevState.message, message)) {
            InteractionManager.runAfterInteractions(this.checkShouldShowMessage);
        }
    }

    static getDerivedStateFromProps(nextProps: Props) {
        return {
            message: nextProps.message,
        };
    }

    checkShouldShowMessage = async () => {
        const { message } = this.props;
        // check if we need to show the message
        let showMessage = false;

        if (message) {
            await Preferences.get(Preferences.keys.XAPP_STORE_IGNORE_MESSAGE_ID)
                .then((lastIgnoreMessageId) => {
                    if (message?.id && (!lastIgnoreMessageId || Number(message?.id) > Number(lastIgnoreMessageId))) {
                        showMessage = true;
                    }
                })
                .catch(() => {
                    // ignore
                });
        }

        this.setState({
            showMessage,
        });
    };

    onClosePress = () => {
        const { message } = this.state;

        if (!message) {
            return;
        }

        // hide the component
        this.setState({
            showMessage: false,
        });

        // persist the decision on the store
        Preferences.set(Preferences.keys.XAPP_STORE_IGNORE_MESSAGE_ID, `${message.id}`);
    };

    onXAppPress = (app: AppType) => {
        Navigator.showModal<XAppBrowserModalProps>(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: app.identifier,
                title: app.title,
                icon: app.icon,
                origin: XAppOrigin.XAPP_STORE_MESSAGE,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
    };

    renderContent = () => {
        const { message } = this.props;

        const { content, app } = message!;
        // in v3.0 we introduced the xapp button, so by order xapp || content

        if (app) {
            return <AppItem item={app} onPress={this.onXAppPress} action={AppActions.LUNCH_APP} />;
        }

        return <Text style={AppStyles.subtext}>{content}</Text>;
    };

    render() {
        const { containerStyle, visible } = this.props;
        const { showMessage, message } = this.state;

        if (!showMessage || !message || !visible) {
            return null;
        }

        const { title } = message;

        return (
            <View style={[styles.container, containerStyle]}>
                <View style={AppStyles.row}>
                    <View style={AppStyles.flex1}>
                        <Text style={styles.titleText}>{title}</Text>
                    </View>
                    <TouchableDebounce
                        hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
                        onPress={this.onClosePress}
                        style={styles.closeButton}
                    >
                        <Icon name="IconX" style={styles.closeButtonIcon} size={20} />
                    </TouchableDebounce>
                </View>
                <View style={styles.contentContainer}>{this.renderContent()}</View>
            </View>
        );
    }
}

export default HeaderMessage;
