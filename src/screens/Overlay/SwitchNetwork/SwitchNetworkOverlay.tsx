/**
 * Switch Network Overlay
 */

import { groupBy } from 'lodash';

import React, { Component, Fragment } from 'react';
import { View, Text, ScrollView, InteractionManager } from 'react-native';

import { CoreRepository, NetworkRepository } from '@store/repositories';
import { NetworkSchema, CoreSchema } from '@store/schemas/latest';
import { NetworkType } from '@store/types';

import { SocketService } from '@services';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { TouchableDebounce, ActionPanel } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreSchema;
    networks: { [key: string]: NetworkSchema[] };
    contentHeight: number;
    paddingBottom: number;
}

const ROW_ITEM_HEIGHT = AppSizes.scale(70);
/* Component ==================================================================== */
class SwitchNetworkOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SwitchNetwork;

    private actionPanel: ActionPanel;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            networks: undefined,
            contentHeight: 0,
            paddingBottom: 0,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setNetworks);
    }

    setNetworks = () => {
        const { coreSettings } = this.state;

        let networks;
        // if developer mode activated then show all networks
        if (coreSettings.developerMode) {
            networks = NetworkRepository.getNetworks();
        } else {
            // otherwise only show MainNet networks
            networks = NetworkRepository.getNetworks({ type: NetworkType.Main });
        }

        // group by the network base on their type
        const networksGrouped = groupBy(networks, 'type');

        const groupCounts = Object.keys(networksGrouped).length;
        const itemsCount = networks.length < 3 ? 3 : networks.length;
        const headerContentHeight = AppSizes.scale(33) + groupCounts * 40 + 70;
        let contentHeight = itemsCount * (ROW_ITEM_HEIGHT + 10) + headerContentHeight;
        let paddingBottom = 0;

        if (contentHeight > AppSizes.screen.height * 0.9) {
            contentHeight = AppSizes.screen.height * 0.9;
            paddingBottom = ROW_ITEM_HEIGHT;
        }

        this.setState({
            networks: networksGrouped,
            contentHeight,
            paddingBottom,
        });
    };

    changeNetwork = (network: NetworkSchema) => {
        // switch network
        SocketService.switchNetwork(network);
        // slide down the panel
        this.actionPanel.slideDown();
    };

    renderRow = (network: NetworkSchema) => {
        const { coreSettings } = this.state;

        // check if network is selected
        const selected = network.networkId === coreSettings.network.networkId;

        return (
            <TouchableDebounce
                // eslint-disable-next-line react/jsx-no-bind
                onPress={this.changeNetwork.bind(null, network)}
                key={`${network.networkId}`}
                style={[AppStyles.row, AppStyles.centerAligned, styles.networkRow, { height: ROW_ITEM_HEIGHT }]}
            >
                <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                    <View style={[styles.networkColorCircle, { backgroundColor: network.color }]} />
                    <View style={AppStyles.flex3}>
                        <Text style={[styles.networkLabel, selected && styles.networkLabelSelected]}>
                            {network.name}
                        </Text>
                        <Text style={[styles.networkNodeText, selected && styles.networkNodeTextSelected]}>
                            {network.defaultNode.endpoint}
                        </Text>
                    </View>
                </View>
                <View style={AppStyles.flex1}>
                    <View style={[selected ? styles.radioCircleSelected : styles.radioCircle, AppStyles.rightSelf]} />
                </View>
            </TouchableDebounce>
        );
    };

    renderContent = () => {
        const { networks } = this.state;

        return Object.keys(networks).map((type: string) => {
            return (
                <Fragment key={type}>
                    {type !== NetworkType.Main && <Text style={styles.networkTypeLabel}>{type}</Text>}
                    {networks[type].map(this.renderRow)}
                </Fragment>
            );
        });
    };

    render() {
        const { networks, contentHeight, paddingBottom } = this.state;

        if (!networks || !contentHeight) return null;

        return (
            <ActionPanel
                height={contentHeight}
                onSlideDown={Navigator.dismissOverlay}
                ref={(r) => {
                    this.actionPanel = r;
                }}
            >
                <View style={AppStyles.paddingBottomSml}>
                    <Text numberOfLines={1} style={AppStyles.h5}>
                        {Localize.t('global.networks')}
                    </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom }}>
                    {this.renderContent()}
                </ScrollView>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default SwitchNetworkOverlay;
