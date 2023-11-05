/**
 * Network rails sync modal
 */

import Realm from 'realm';
import { get, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ScrollView, InteractionManager, Alert } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { NodeModel } from '@store/models';
import { NetworkRailsChangesType, NetworkType } from '@store/types';
import { CoreRepository, NetworkRepository, NodeRepository } from '@store/repositories';

import BackendService from '@services/BackendService';
import NetworkService from '@services/NetworkService';

import { AnimatedDialog, Button, Icon, LoadingIndicator, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onSuccessSync: (changes: Record<string, any[]>) => void;
    onError: () => void;
}

export interface State {
    isLoading: boolean;
    rails: XamanBackend.NetworkRailsResponse;
    changes: Record<string, any[]>;
    headerHeight: number;
}
/* Component ==================================================================== */
class NetworkRailsSyncModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.NetworkRailsSync;

    private readonly animatedDialog = React.createRef<AnimatedDialog>();
    private mounted = false;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            rails: undefined,
            changes: {},
            isLoading: true,
            headerHeight: 0,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchChanges);
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    onDismissRequested = () => {
        Navigator.dismissOverlay();
    };

    onError = (error: any) => {
        const { onError } = this.props;

        // close overlay
        this.onDismissPress();

        // show error
        Alert.alert(Localize.t('global.unexpectedErrorOccurred'), error?.toString());

        // callback
        if (typeof onError === 'function') {
            onError();
        }
    };

    onSuccessSync = () => {
        const { onSuccessSync } = this.props;
        const { changes } = this.state;

        // close overlay
        this.onDismissPress();

        // callback
        if (typeof onSuccessSync === 'function') {
            onSuccessSync(changes);
        }
    };

    fetchChanges = async () => {
        try {
            // get core settings
            const coreSettings = CoreRepository.getSettings();

            // fetch network rails
            const rails = await BackendService.getNetworkRails();

            // keep track of changes
            const changes = {} as any;

            // added || existing network
            Object.keys(rails).forEach((networkKey) => {
                // clean up networks from duplicated items
                const foundNetworks = NetworkRepository.findBy('key', networkKey);
                if (foundNetworks.length > 1) {
                    for (const duplicatedNetwork of foundNetworks) {
                        if (duplicatedNetwork.id !== coreSettings.network.id) {
                            NetworkRepository.delete(duplicatedNetwork);
                        }
                    }
                }

                // default changes
                changes[networkKey] = [];

                const remoteNetwork = rails[networkKey];
                const localeNetwork = NetworkRepository.findOne({ key: networkKey });

                // new network is added
                if (!localeNetwork) {
                    changes[networkKey].push({
                        type: NetworkRailsChangesType.AddedNetwork,
                        value: remoteNetwork.name,
                    });
                    remoteNetwork.endpoints.forEach((node) => {
                        changes[networkKey].push({
                            type: NetworkRailsChangesType.AddedNode,
                            value: node.url,
                        });
                    });
                    return;
                }

                // added new node
                remoteNetwork.endpoints.forEach((endpoint) => {
                    if (!localeNetwork.nodes.find((node) => endpoint.url === node.endpoint)) {
                        changes[networkKey].push({
                            type: NetworkRailsChangesType.AddedNode,
                            value: endpoint.url,
                        });
                    }
                });

                // removed node
                localeNetwork.nodes.forEach((node) => {
                    if (!remoteNetwork.endpoints.find((endpoint) => endpoint.url === node.endpoint)) {
                        changes[networkKey].push({
                            type: NetworkRailsChangesType.RemovedNode,
                            value: node.endpoint,
                        });
                    }
                });

                // changed property
                [
                    { locale: 'name', remote: 'name' },
                    { locale: 'color', remote: 'color' },
                    { locale: 'nativeAsset.asset', remote: 'native_asset' },
                    { locale: 'nativeAsset.icon', remote: 'icons.icon_asset' },
                    { locale: 'nativeAsset.iconSquare', remote: 'icons.icon_square' },
                ].forEach((property) => {
                    if (get(remoteNetwork, property.remote) !== get(localeNetwork, property.locale)) {
                        changes[networkKey].push({
                            type: NetworkRailsChangesType.ChangedProperty,
                            value: property.locale,
                        });
                    }
                });
            });

            // removed networks
            NetworkRepository.findAll().forEach((network) => {
                if (!Object.keys(rails).includes(network.key)) {
                    changes[network.key] = [
                        {
                            type: NetworkRailsChangesType.RemovedNetwork,
                            value: network.name,
                        },
                    ];
                }
            });

            // clean up
            Object.keys(changes).forEach((key) => {
                if (changes[key].length === 0) {
                    delete changes[key];
                }
            });

            // user could have been already closed the modal
            if (this.mounted) {
                this.setState(
                    {
                        rails,
                        changes,
                    },
                    () => {
                        // no changes to apply
                        if (isEmpty(changes)) {
                            this.onSuccessSync();
                        }
                    },
                );
            }
        } catch (error: any) {
            this.onError(error);
        } finally {
            if (this.mounted) {
                this.setState({
                    isLoading: false,
                });
            }
        }
    };

    applyRailChanges = async () => {
        const { rails, changes } = this.state;

        try {
            // get connect network details
            const connectionDetails = NetworkService.getConnectionDetails();

            // validate changes
            for (const networkKey of Object.keys(changes)) {
                for (const change of changes[networkKey]) {
                    if (
                        change.type === NetworkRailsChangesType.RemovedNetwork &&
                        networkKey === connectionDetails.networkKey
                    ) {
                        throw new Error(
                            Localize.t('settings.syncRailsRemoveNetworkWarning', { currentNetwork: change.value }),
                        );
                    }

                    if (
                        change.type === NetworkRailsChangesType.RemovedNode &&
                        change.value === connectionDetails.node
                    ) {
                        throw new Error(
                            Localize.t('settings.syncRailsRemoveNodeWarning', { connectedNode: change.value }),
                        );
                    }
                }
            }

            for (const networkKey of Object.keys(rails)) {
                if (!Object.keys(changes).includes(networkKey)) {
                    // nothing changed for this network
                    continue;
                }

                // apply network changes
                const network = await NetworkRepository.update({
                    id: rails[networkKey].chain_id,
                    key: networkKey,
                    name: rails[networkKey].name,
                    type: rails[networkKey].is_livenet ? NetworkType.Main : NetworkType.Test,
                    nativeAsset: {
                        asset: rails[networkKey].native_asset,
                        icon: rails[networkKey].icons.icon_asset,
                        iconSquare: rails[networkKey].icons.icon_square,
                    },
                    color: rails[networkKey].color,
                    updatedAt: new Date(),
                });

                const nodes = [] as unknown as Realm.List<NodeModel>;

                // added node
                for (const { url } of rails[networkKey].endpoints) {
                    if (!network.nodes.find((node) => node.endpoint === url)) {
                        nodes.push(
                            await NodeRepository.create({
                                id: new Realm.BSON.ObjectId(),
                                endpoint: url,
                                registerAt: new Date(),
                                updatedAt: new Date(),
                            }),
                        );
                    }
                }

                for (const node of network.nodes) {
                    // remove node
                    if (!rails[networkKey].endpoints.find((endpoint) => endpoint.url === node.endpoint)) {
                        await NodeRepository.delete(node);
                    } else {
                        nodes.push(node);
                    }
                }

                // apply new nodes list
                await NetworkRepository.update({
                    id: network.id,
                    nodes,
                });

                // check if we removed the default node for this network
                if (!network.defaultNode || !network.defaultNode.isValid()) {
                    await NetworkRepository.update({
                        id: rails[networkKey].chain_id,
                        defaultNode: nodes[0],
                    });
                }
            }

            // removed networks
            NetworkRepository.findAll().forEach((network) => {
                if (!Object.keys(rails).includes(network.key)) {
                    NetworkRepository.delete(network);
                }
            });

            // success
            this.onSuccessSync();
        } catch (error: any) {
            this.onError(error);
        }
    };

    onDismissPress = () => {
        if (this.animatedDialog?.current) {
            this.animatedDialog.current.dismiss();
        }
    };

    getChangesDescription = (type: NetworkRailsChangesType, value: string): React.ReactNode => {
        switch (type) {
            case NetworkRailsChangesType.RemovedNetwork:
                return (
                    <View style={[styles.changesRow, styles.changesRowRed]}>
                        <View style={AppStyles.flex1}>
                            <Text key={`${type}-${value}`} style={[styles.changesText, styles.changesRemoved]}>
                                {Localize.t('settings.removeNetwork')}
                            </Text>
                        </View>
                        <Icon size={20} name="IconX" style={AppStyles.imgColorRed} />
                    </View>
                );
            case NetworkRailsChangesType.AddedNode:
                return (
                    <View style={[styles.changesRow, styles.changesRowGreen]}>
                        <View style={AppStyles.flex1}>
                            <Text key={`${type}-${value}`} style={[styles.changesText, styles.changesAdded]}>
                                {Localize.t('settings.addedNode')}: <Text style={styles.changesValue}>{value}</Text>
                            </Text>
                        </View>
                        <Icon size={20} name="IconPlus" style={AppStyles.imgColorGreen} />
                    </View>
                );
            case NetworkRailsChangesType.RemovedNode:
                return (
                    <View style={[styles.changesRow, styles.changesRowRed]}>
                        <View style={AppStyles.flex1}>
                            <Text key={`${type}-${value}`} style={[styles.changesText, styles.changesRemoved]}>
                                {Localize.t('settings.removedNode')}: <Text style={styles.changesValue}>{value}</Text>
                            </Text>
                        </View>
                        <Icon size={20} name="IconMinus" style={AppStyles.imgColorRed} />
                    </View>
                );
            case NetworkRailsChangesType.ChangedProperty:
                return (
                    <View style={[styles.changesRow, styles.changesRowOrange]}>
                        <View style={AppStyles.flex1}>
                            <Text key={`${type}-${value}`} style={[styles.changesText, styles.changesModified]}>
                                {Localize.t('settings.changedProperty')}:{' '}
                                <Text style={styles.changesValue}>{value}</Text>
                            </Text>
                        </View>
                        <Icon size={15} name="IconEdit" style={AppStyles.imgColorOrange} />
                    </View>
                );
            default:
                return null;
        }
    };

    renderChangeHeader = (networkKey: string) => {
        const { rails } = this.state;

        let networkName = '';
        let networkColor = '';

        if (Object.prototype.hasOwnProperty.call(rails, networkKey)) {
            networkName = rails[networkKey].name;
            networkColor = rails[networkKey].color;
        } else {
            const localNetwork = NetworkRepository.findOne({ key: networkKey });

            networkName = localNetwork.name;
            networkColor = localNetwork.color;
        }

        return (
            <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingHorizontalExtraSml]}>
                <View
                    style={[
                        {
                            backgroundColor: networkColor,
                            borderRadius: (AppSizes.scale(13) * 1.4) / 2,
                            width: AppSizes.scale(13),
                            height: AppSizes.scale(13),
                        },
                    ]}
                />
                <Text style={styles.networkNameText}>{networkName}</Text>
            </View>
        );
    };

    renderChanges = () => {
        const { changes, headerHeight } = this.state;

        return (
            <>
                <ScrollView style={styles.scrollContainer}>
                    {Object.keys(changes).map((key) => {
                        return (
                            <View key={key} style={styles.changesContainer}>
                                {this.renderChangeHeader(key)}
                                {changes[key].map((c: any) => this.getChangesDescription(c.type, c.value))}
                            </View>
                        );
                    })}
                </ScrollView>
                <View style={[AppStyles.row, { marginBottom: headerHeight }]}>
                    <View style={AppStyles.flex1}>
                        <Button
                            testID="apply-button"
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.apply')}
                            iconStyle={AppStyles.imgColorWhite}
                            onPress={this.applyRailChanges}
                        />
                    </View>
                </View>
            </>
        );
    };

    renderLoading = () => {
        return (
            <View style={AppStyles.centerAligned}>
                <LoadingIndicator size="large" />
                <Spacer />
                <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.loading')}...</Text>
            </View>
        );
    };

    renderHeader = () => {
        return (
            <>
                <View style={AppStyles.flex1}>
                    <Text numberOfLines={1} style={[AppStyles.p, AppStyles.bold]}>
                        {Localize.t('settings.networkUpdates')}
                    </Text>
                </View>
                <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                    <Button
                        numberOfLines={1}
                        testID="close-button"
                        label={Localize.t('global.close')}
                        roundedSmall
                        secondary
                        onPress={this.onDismissPress}
                    />
                </View>
            </>
        );
    };

    renderContent = () => {
        const { isLoading, changes } = this.state;

        // still loading
        if (isLoading) {
            return this.renderLoading();
        }

        // no changes
        if (isEmpty(changes)) {
            return null;
        }

        return this.renderChanges();
    };

    render() {
        const { changes } = this.state;

        return (
            <AnimatedDialog
                ref={this.animatedDialog}
                height={AppSizes.heightPercentageToDP(isEmpty(changes) ? 50 : 70)}
                onDismiss={this.onDismissRequested}
            >
                <View style={styles.headerContainer}>{this.renderHeader()}</View>
                <View style={styles.contentContainer}>{this.renderContent()}</View>
            </AnimatedDialog>
        );
    }
}

/* Export Component ==================================================================== */
export default NetworkRailsSyncModal;
