/**
 * Networks settings Screen
 */
import { first } from 'lodash';

import React, { Component } from 'react';
import { View, InteractionManager } from 'react-native';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import NetworkService from '@services/NetworkService';

import { NetworkRepository } from '@store/repositories';
import { NetworkModel, NodeModel } from '@store/models';

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

        networks.forEach((network: NetworkModel) => {
            dataSource.push({
                key: network.key,
                title: network.name,
                color: network.color,
                defaultNode: network.defaultNode,
                type: network.type,
                data: network.nodes.sorted([['registerAt', false]]),
            });
        });

        this.setState({
            dataSource,
        });
    };

    onNodePress = (node: NodeModel) => {
        // get network
        const network = first(node.linkingObjects<NetworkModel>('Network', 'nodes'));

        // nothing changed
        if (network.defaultNode.endpoint === node.endpoint) {
            return;
        }

        // update the datastore
        NetworkRepository.update({
            id: network.id,
            defaultNode: node,
        });

        // switch to the new default node if we already connected to the same network
        if (network.id === NetworkService.getNetworkId()) {
            NetworkService.switchNetwork(network);
        }

        // update dataSource
        this.updateDataSource();
    };

    showNetworkRailsSync = async () => {
        Navigator.showOverlay(AppScreens.Overlay.NetworkRailsSync, {
            onSuccessSync: this.updateDataSource,
        });
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
                    rightComponent={{
                        testID: 'sync-rails-button',
                        icon: 'IconRefresh',
                        iconSize: 21,
                        onPress: this.showNetworkRailsSync,
                    }}
                />
                <NodeList dataSource={dataSource} onItemPress={this.onNodePress} />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default NetworkSettingView;
