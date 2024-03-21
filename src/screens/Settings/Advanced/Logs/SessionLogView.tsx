/**
 * Session Log Screen
 */
import { flatMap, toString } from 'lodash';
import React, { Component } from 'react';
import { View, Text, FlatList, Platform, Linking, Alert } from 'react-native';

import { ActionSheet, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Clipboard } from '@common/helpers/clipboard';

import { AppScreens, AppConfig } from '@common/constants';

import LoggerService, { LogEntry } from '@services/LoggerService';
import StyleService from '@services/StyleService';

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

    clear = () => {
        // clear logs
        LoggerService.clearLogs();

        // force reload this screen
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

        Linking.openURL(content).catch(() => {
            Alert.alert(Localize.t('global.error'), Localize.t('settings.canNotSendLogsByEmail'));
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
            StyleService.isDarkMode() ? 'dark' : 'light',
        );
    };

    renderLogItem = ({ item }: { item: LogEntry }) => {
        const { timestamp, level, message, data } = item;

        return (
            <Text selectable style={[styles.logRow, styles[level]]}>
                <Text style={AppStyles.bold}>
                    [{timestamp}][{level}]{' '}
                </Text>
                {message} {data && this.normalizeLog(data)}
            </Text>
        );
    };

    keyExtractor = (item: LogEntry, index: number) => {
        return `row-${index}`;
    };

    render() {
        return (
            <View testID="session-log-view" style={AppStyles.container}>
                <Header
                    centerComponent={{ text: Localize.t('settings.sessionLog') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    rightComponent={{
                        icon: 'IconMoreHorizontal',
                        onPress: this.showMenu,
                    }}
                />
                <FlatList
                    contentContainerStyle={styles.listContainer}
                    data={LoggerService.getLogs()}
                    renderItem={this.renderLogItem}
                    keyExtractor={this.keyExtractor}
                    ListEmptyComponent={<Text>{Localize.t('settings.noLogs')}</Text>}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SessionLogView;
