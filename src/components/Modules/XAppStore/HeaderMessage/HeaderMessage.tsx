import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { View, Text, InteractionManager, ViewStyle } from 'react-native';

import Preferences from '@common/libs/preferences';

import { Icon, TouchableDebounce } from '@components/General';

import { AppStyles } from '@theme';

import styles from './styles';

/* Types ==================================================================== */
type Message = {
    id: number;
    title: string;
    content: string;
};

interface Props {
    message: Message;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    message?: Message;
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
        const { message, showMessage } = this.state;

        return !isEqual(nextState.message, message) || !isEqual(nextState.showMessage, showMessage);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.checkShouldShowMessage);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const { message } = this.state;
        if (!isEqual(prevState.message, message)) {
            this.checkShouldShowMessage();
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

    render() {
        const { containerStyle } = this.props;
        const { showMessage, message } = this.state;

        if (!showMessage || !message) {
            return null;
        }

        const { title, content } = message;

        return (
            <View style={[styles.container, containerStyle]}>
                <View style={AppStyles.row}>
                    <View style={AppStyles.flex1}>
                        <Text style={styles.titleText}>{title}</Text>
                    </View>
                    <TouchableDebounce onPress={this.onClosePress} style={styles.closeButton}>
                        <Icon name="IconX" style={styles.closeButtonIcon} size={23} />
                    </TouchableDebounce>
                </View>
                <View style={styles.contentContainer}>
                    <Text style={AppStyles.subtext}>{content}</Text>
                </View>
            </View>
        );
    }
}

export default HeaderMessage;
