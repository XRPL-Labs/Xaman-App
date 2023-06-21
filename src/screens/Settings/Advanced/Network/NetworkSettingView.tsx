/**
 * Network settings Screen
 */

import React, { Component } from 'react';
import { View, Alert, InteractionManager } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import NetworkService from '@services/NetworkService';

import { NetworkRepository, NodeRepository, CoreRepository } from '@store/repositories';
import { NetworkSchema, NodeSchema } from '@store/schemas/latest';

import { Header } from '@components/General';
import { NodeList } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {}

export interface State {
    dataSource: any;
}

/* Component ==================================================================== */
class NetworkSettingView extends Component<Props, State> {
    static screenName = AppScreens.Settings.Network.List;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            dataSource: [],
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.updateDataSource);
    }

    updateDataSource = () => {
        const networks = NetworkRepository.getNetworks();

        const dataSource = [] as any[];

        networks.forEach((network: NetworkSchema) => {
            dataSource.push({
                key: network.key,
                title: network.name,
                color: network.color,
                defaultNode: network.defaultNode,
                type: network.type,
                data: network.nodes,
            });
        });

        this.setState({
            dataSource,
        });
    };

    onNodePress = (node: NodeSchema) => {
        // nothing changed
        if (node.network.defaultNode.endpoint === node.endpoint) {
            return;
        }

        // update the datastore
        NetworkRepository.update({
            networkId: node.network.networkId,
            defaultNode: node,
        });

        // switch to the new default node if we already connected to the same network
        if (node.network.networkId === NetworkService.getConnectedNetworkId()) {
            NetworkService.switchNetwork(node.network);
        }

        // update dataSource
        this.updateDataSource();
    };

    onNodeRemovePress = (node: NodeSchema) => {
        const { network } = node;

        // check if we are currently connected to this network
        const coreSettings = CoreRepository.getSettings();

        if (coreSettings.network.networkId === network.networkId) {
            Alert.alert(Localize.t('global.error'), Localize.t('settings.unableToDeleteNodeWhenConnectedToNetwork'));
            return;
        }

        // check if the deleting node is the defaultNode for this network
        const shouldSwitchDefaultNode = network.defaultNode.endpoint === node.endpoint;

        // remove the node
        NodeRepository.delete(node);

        // check if the network is empty then remove network as well
        if (network.nodes.length === 0) {
            NetworkRepository.delete(network);
        } else if (shouldSwitchDefaultNode) {
            // if not empty then set the first node as default node for this network
            NetworkRepository.update({
                networkId: network.networkId,
                defaultNode: network.nodes[0],
            });
        }

        // update dataSource
        this.updateDataSource();
    };

    render() {
        const { dataSource } = this.state;

        return (
            <View testID="network-list-screen" style={AppStyles.container}>
                <Header
                    leftComponent={{
                        testID: 'back-button',
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('settings.networkList') }}
                />
                <NodeList
                    dataSource={dataSource}
                    onItemPress={this.onNodePress}
                    onItemRemovePress={this.onNodeRemovePress}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default NetworkSettingView;
