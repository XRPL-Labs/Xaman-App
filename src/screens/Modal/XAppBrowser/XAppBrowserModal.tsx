/**
 * XApp Browser modal
 */

import React, { Component } from 'react';
import { View, ActivityIndicator, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

import { Navigator } from '@common/helpers/navigator';

import { hasNotch } from '@common/helpers/device';
import { AppScreens } from '@common/constants';

import { Header } from '@components/General';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    uri: string;
    title: string;
    headers: object;
}

export interface State {
    paddingBottom: number;
}

/* Component ==================================================================== */
class XAppBrowserModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.XAppBrowser;
    private backHandler: any;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            paddingBottom: hasNotch() ? 20 : 0,
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

    openSignRequest = (uuid: string) => {
        // NOT IMPLEMENTED yet
        // eslint-disable-next-line no-console
        console.log(uuid);
    };

    onMessage = (event: any) => {
        const { data } = event.nativeEvent;
        const jsonData = JSON.parse(data);
        // NOT IMPLEMENTED yet
        // eslint-disable-next-line no-console
        console.log(jsonData);
    };

    render() {
        const { uri, title, headers } = this.props;
        const { paddingBottom } = this.state;

        return (
            <View testID="xapp-browser-modal" style={[styles.container]}>
                <Header
                    centerComponent={{ text: title }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onClose,
                    }}
                />

                <WebView
                    containerStyle={[AppStyles.flex1, { paddingBottom }]}
                    startInLoadingState
                    renderLoading={() => (
                        <ActivityIndicator color={AppColors.blue} style={styles.loadingStyle} size="large" />
                    )}
                    source={{ uri, headers }}
                    onMessage={this.onMessage}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default XAppBrowserModal;
