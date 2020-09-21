/**
 * Session Log Screen
 */
import { flatMap, toString } from 'lodash';
import React, { Component } from 'react';
import { View, Text, FlatList, Platform, Linking, Alert } from 'react-native';

import Clipboard from '@react-native-community/clipboard';

import { Navigation } from 'react-native-navigation';

import { ActionSheet, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens, AppConfig } from '@common/constants';

import { LoggerService } from '@services';

import { Header } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class SessionLogView extends Component<Props, State> {
    static screenName = AppScreens.Settings.SessionLog;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {};

        Navigation.events().bindComponent(this);
    }

    navigationButtonPressed({ buttonId }: { buttonId: string }) {
        if (buttonId === 'logMenu') {
            this.showMenu();
        }
    }

    clear = () => {
        LoggerService.clearLogs();
        this.forceUpdate();
    };

    normalizeLog = (log: any) => {
        try {
            return JSON.stringify(log);
        } catch {
            return toString(log);
        }
    };

    copyToClipboard = () => {
        const logs = LoggerService.getLogs();
        const body = flatMap(logs, (l) => {
            return `[${l.timestamp}] ${l.message} ${l.data && this.normalizeLog(l.data)}`;
        }).join('\n');

        Clipboard.setString(body);
        Toast(Localize.t('settings.logsCopiedToClipboard'));
    };

    sendEmail = () => {
        const logs = LoggerService.getLogs();
        const body = flatMap(logs, (l) => {
            return `[${l.timestamp}] ${l.message} ${l.data && this.normalizeLog(l.data)}`;
        }).join('\n');

        const content = `mailto:${AppConfig.supportEmail}?subject=SessionLogs&body=${body}`;

        Linking.canOpenURL(content).then((support) => {
            if (support) {
                Linking.openURL(content);
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('settings.canNotSendLogsByEmail'));
            }
        });
    };

    showMenu = () => {
        const IosButtons = [
            Localize.t('global.copy'),
            Localize.t('settings.sendMail'),
            Localize.t('settings.clearLogs'),
            Localize.t('global.cancel'),
        ];
        const AndroidButtons = [
            Localize.t('global.copy'),
            Localize.t('settings.sendMail'),
            Localize.t('settings.clearLogs'),
        ];
        ActionSheet(
            {
                options: Platform.OS === 'ios' ? IosButtons : AndroidButtons,
                destructiveButtonIndex: 2,
                cancelButtonIndex: 3,
            },
            (buttonIndex: number) => {
                if (buttonIndex === 0) {
                    this.copyToClipboard();
                }
                if (buttonIndex === 1) {
                    this.sendEmail();
                }
                if (buttonIndex === 2) {
                    this.clear();
                }
            },
        );
    };

    renderLogItem = ({ item }: { item: any }) => {
        const { timestamp, level, message, data } = item;

        return (
            // @ts-ignore
            <Text selectable style={[styles.logRow, styles[level]]}>
                <Text style={AppStyles.bold}>
                    [{timestamp}][{level}]{' '}
                </Text>
                {message} {data && this.normalizeLog(data)}
            </Text>
        );
    };

    render() {
        return (
            <View testID="session-log-view" style={[AppStyles.container]}>
                <Header
                    centerComponent={{ text: Localize.t('settings.sessionLog') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    rightComponent={{
                        icon: 'IconMoreHorizontal',
                        onPress: () => {
                            this.showMenu();
                        },
                    }}
                />
                <FlatList
                    contentContainerStyle={styles.listContainer}
                    data={LoggerService.getLogs()}
                    renderItem={this.renderLogItem}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={<Text>{Localize.t('settings.noLogs')}</Text>}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SessionLogView;
