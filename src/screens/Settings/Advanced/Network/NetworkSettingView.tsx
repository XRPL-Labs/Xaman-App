/**
 * Networks settings Screen
 */
import { first, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, InteractionManager, Alert } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';

import { AppScreens } from '@common/constants';

import NetworkService from '@services/NetworkService';

import { NetworkRepository } from '@store/repositories';
import { NetworkModel, NodeModel } from '@store/models';

import { Header, InfoMessage } from '@components/General';
import { NodeList } from '@components/Modules';

import Localize from '@locale';

// style
import styles from './styles';

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

    onNodePress = async (node: NodeModel) => {
        // get network
        const network = first(node.linkingObjects<NetworkModel>('Network', 'nodes'));

        if (!network) {
            throw new Error('Node does not have linked network object');
        }

        // if this is the only node for this network then show a message
        if (network.nodes.length === 1) {
            Prompt(Localize.t('global.notice'), Localize.t('settings.networkHaveOnlyOneNodeAsDefault'));
            return;
        }

        // nothing changed
        if (network.defaultNode.endpoint === node.endpoint) {
            return;
        }

        // update the datastore
        NetworkRepository.update({
            id: network.id,
            defaultNode: node,
        });

        const connectedNetwork = NetworkService.getNetwork();

        // switch to the new default node if we already connected to the same network
        if (network.id.equals(connectedNetwork.id)) {
            await NetworkService.switchNetwork(network);
        }

        // update dataSource
        this.updateDataSource();
    };

    onSuccessSync = (changes: Record<string, any[]>) => {
        // nothing changed
        if (isEmpty(changes)) {
            Alert.alert(Localize.t('settings.everythingIsUpdateToDate'), Localize.t('settings.networkAreUpdateToDate'));
            return;
        }

        // update the datastore
        this.updateDataSource();
        // show message
        Alert.alert(Localize.t('global.success'), Localize.t('settings.networkRailsSuccessfullyUpdated'));
    };

    showNetworkRailsSync = async () => {
        Navigator.showOverlay(AppScreens.Overlay.NetworkRailsSync, {
            onSuccessSync: this.onSuccessSync,
        });
    };

    render() {
        const { dataSource } = this.state;

        return (
            <View testID="network-list-screen" style={styles.container}>
                <Header
                    leftComponent={{
                        testID: 'back-button',
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('settings.networkSettings') }}
                    rightComponent={{
                        testID: 'sync-rails-button',
                        icon: 'IconRefresh',
                        iconSize: 21,
                        onPress: this.showNetworkRailsSync,
                    }}
                />
                <InfoMessage
                    label={Localize.t('settings.changeDefaultNodeInfo')}
                    type="neutral"
                    containerStyle={styles.infoMessage}
                    flat
                />
                <NodeList dataSource={dataSource} onItemPress={this.onNodePress} />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default NetworkSettingView;
