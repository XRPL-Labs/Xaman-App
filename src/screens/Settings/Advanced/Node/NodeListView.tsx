/**
 * Node List Screen
 */

import { flatMap } from 'lodash';
import { Results } from 'realm';

import React, { Component } from 'react';
import { View, InteractionManager } from 'react-native';

import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens, AppConfig } from '@common/constants';

import SocketService from '@services/SocketService';

import { CoreRepository, CustomNodeRepository } from '@store/repositories';
import { CoreSchema, CustomNodeSchema } from '@store/schemas/latest';
import { NodeChain } from '@store/types';

import { Header } from '@components/General';
import { NodeList } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreSchema;
    customNodes: Results<CustomNodeSchema>;
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
            coreSettings: CoreRepository.getSettings(),
            customNodes: CustomNodeRepository.getNodes(),
            dataSource: [],
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.updateDataSource);

        CoreRepository.on('updateSettings', this.updateUI);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({ coreSettings });
    };

    updateDataSource = () => {
        const { customNodes } = this.state;

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

        if (!customNodes.isEmpty()) {
            nodesCategoryMap.push({
                title: Localize.t('global.custom'),
                data: flatMap(customNodes, (n) => {
                    return { chain: NodeChain.Custom, url: n.endpoint };
                }),
            });
        }

        this.setState({
            dataSource: nodesCategoryMap,
        });
    };

    onItemPress = (item: any) => {
        const { coreSettings, dataSource } = this.state;

        let currentChain = NodeChain.Main;

        // check if current chain is changed
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
                        style: 'destructive',
                        onPress: () => {
                            SocketService.switchNode(item.url, item.chain);
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

    onItemRemovePress = (item: any) => {
        // remove the custom node
        CustomNodeRepository.deleteBy('endpoint', item.url);

        // update nodes
        this.setState(
            {
                customNodes: CustomNodeRepository.getNodes(),
            },
            this.updateDataSource,
        );
    };

    render() {
        const { dataSource, coreSettings } = this.state;

        return (
            <View testID="nodes-list-screen" style={[AppStyles.container]}>
                <Header
                    leftComponent={{
                        testID: 'back-button',
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('settings.nodeList') }}
                />
                <NodeList
                    dataSource={dataSource}
                    selectedNode={coreSettings.defaultNode}
                    onItemPress={this.onItemPress}
                    onItemRemovePress={this.onItemRemovePress}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default NodeListView;
