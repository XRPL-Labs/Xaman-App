/**
 * Node List Screen
 */

import { flatMap } from 'lodash';

import React, { Component } from 'react';
import { View, Text, SectionList, TouchableHighlight } from 'react-native';

import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens, AppConfig } from '@common/constants';

import { SocketService } from '@services';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { NodeChain } from '@store/types';

import { Header, Icon } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreSchema;
    dataSource: any;
}

/* Component ==================================================================== */
class NodeListView extends Component<Props, State> {
    static screenName = AppScreens.Settings.Node.List;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            coreSettings: undefined,
            dataSource: [],
        };
    }

    componentDidMount() {
        const coreSettings = CoreRepository.getSettings();

        this.setState({
            dataSource: this.convertNodesArrayToMap(),
            coreSettings,
        });

        CoreRepository.on('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({ coreSettings });
    };

    convertNodesArrayToMap = () => {
        // set default nodes
        const nodesCategoryMap = [
            {
                title: Localize.t('global.mainnet'),
                data: flatMap(AppConfig.nodes.main, (n) => {
                    return { chain: NodeChain.Main, url: n };
                }),
            },
            {
                title: Localize.t('global.testnet'),
                data: flatMap(AppConfig.nodes.test, (n) => {
                    return { chain: NodeChain.Test, url: n };
                }),
            },
        ];

        return nodesCategoryMap;
    };

    onItemPress = (item: any) => {
        const { coreSettings, dataSource } = this.state;

        let currentChain = NodeChain.Main;

        dataSource.forEach((elm: any) => {
            const found = elm.data.filter((r: any) => {
                return r.url === coreSettings.defaultNode;
            });

            if (found.length > 0) currentChain = found[0].chain;
        });

        if (currentChain !== item.chain) {
            Prompt(
                Localize.t('global.warning'),
                Localize.t('settings.nodeChangeWarning', { from: currentChain, to: item.chain }),
                [
                    { text: Localize.t('global.cancel') },
                    {
                        text: Localize.t('global.doIt'),
                        onPress: () => {
                            CoreRepository.saveSettings({
                                defaultNode: item.url,
                            });

                            SocketService.onNodeChange(item.url, item.chain);
                        },
                    },
                ],
                { type: 'default' },
            );
        } else {
            CoreRepository.saveSettings({
                defaultNode: item.url,
            });

            SocketService.onNodeChange(item.url, item.chain);
        }
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
        );
    };

    renderItem = (node: { item: any; section: any }) => {
        const { coreSettings } = this.state;
        const { item, section } = node;

        const selected = item.url === coreSettings.defaultNode;

        return (
            <TouchableHighlight
                onPress={() => {
                    this.onItemPress(item);
                }}
                underlayColor="rgba(154, 154, 154, 0.25)"
            >
                <View style={[styles.row]}>
                    <View style={[AppStyles.row, AppStyles.flex6, AppStyles.centerAligned]}>
                        <Text style={styles.url}>{item.url}</Text>
                        {section.category === 'custom' && (
                            <View
                                style={[
                                    styles.chainLabel,
                                    item.chain === NodeChain.Main ? styles.chainLabelMain : styles.chainLabelTest,
                                ]}
                            >
                                <Text style={[AppStyles.monoSubText]}> {item.chain} </Text>
                            </View>
                        )}
                    </View>
                    {selected && (
                        <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                            <Icon size={20} style={styles.checkIcon} name="IconCheck" />
                        </View>
                    )}
                </View>
            </TouchableHighlight>
        );
    };

    render() {
        const { dataSource } = this.state;

        return (
            <View testID="node-list-view" style={[AppStyles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('settings.nodeList') }}
                />
                <SectionList
                    sections={dataSource}
                    renderItem={this.renderItem}
                    renderSectionHeader={this.renderSectionHeader}
                    keyExtractor={(item, index) => item.url + index}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default NodeListView;
