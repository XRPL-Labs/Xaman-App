/**
 * Network rails sync modal
 */

import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ScrollView, InteractionManager, Alert } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { NetworkRailsChangesType } from '@store/types';
import { NetworkRepository } from '@store/repositories';

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
    rails?: XamanBackend.NetworkRailsResponse;
    changes: Record<string, any[]>;
    isLoading: boolean;
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

    onError = (error: Error) => {
        const { onError } = this.props;

        // close overlay
        this.onDismissPress();

        // show error
        Alert.alert(Localize.t('global.error'), error?.message);

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
            // fetch network rails
            const rails = await BackendService.getNetworkRails();

            // process the network changes from rails response
            const changes = NetworkRepository.getNetworkChanges(rails);

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
            const connectedNetwork = NetworkService.getNetwork();

            // validate changes before running the sync and applying the changes
            for (const networkKey of Object.keys(changes)) {
                for (const change of changes[networkKey]) {
                    if (change.type === NetworkRailsChangesType.RemovedNetwork && networkKey === connectedNetwork.key) {
                        throw new Error(
                            Localize.t('settings.syncRailsRemoveNetworkWarning', {
                                currentNetwork: connectedNetwork.name,
                            }),
                        );
                    }

                    if (
                        change.type === NetworkRailsChangesType.RemovedNode &&
                        change.value === connectedNetwork.defaultNode.endpoint
                    ) {
                        throw new Error(
                            Localize.t('settings.syncRailsRemoveNodeWarning', { connectedNode: change.value }),
                        );
                    }
                }
            }

            // apply network changes
            await NetworkRepository.applyNetworkChanges(rails!, changes);
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
                    <View key={`${type}-${value}`} style={[styles.changesRow, styles.changesRowRed]}>
                        <View style={AppStyles.flex1}>
                            <Text style={[styles.changesText, styles.changesRemoved]}>
                                {Localize.t('settings.removeNetwork')}
                            </Text>
                        </View>
                        <Icon size={20} name="IconX" style={AppStyles.imgColorRed} />
                    </View>
                );
            case NetworkRailsChangesType.AddedNode:
                return (
                    <View key={`${type}-${value}`} style={[styles.changesRow, styles.changesRowGreen]}>
                        <View style={AppStyles.flex1}>
                            <Text style={[styles.changesText, styles.changesAdded]}>
                                {Localize.t('settings.addedNode')}: <Text style={styles.changesValue}>{value}</Text>
                            </Text>
                        </View>
                        <Icon size={20} name="IconPlus" style={AppStyles.imgColorGreen} />
                    </View>
                );
            case NetworkRailsChangesType.RemovedNode:
                return (
                    <View key={`${type}-${value}`} style={[styles.changesRow, styles.changesRowRed]}>
                        <View style={AppStyles.flex1}>
                            <Text style={[styles.changesText, styles.changesRemoved]}>
                                {Localize.t('settings.removedNode')}: <Text style={styles.changesValue}>{value}</Text>
                            </Text>
                        </View>
                        <Icon size={20} name="IconMinus" style={AppStyles.imgColorRed} />
                    </View>
                );
            case NetworkRailsChangesType.ChangedProperty:
                return (
                    <View key={`${type}-${value}`} style={[styles.changesRow, styles.changesRowOrange]}>
                        <View style={AppStyles.flex1}>
                            <Text style={[styles.changesText, styles.changesModified]}>
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

        let networkName = 'UNKNOWN_NETWORK';
        let networkColor = '#000';

        if (rails && networkKey in rails) {
            networkName = rails[networkKey].name;
            networkColor = rails[networkKey].color;
        } else {
            const localNetwork = NetworkRepository.findOne({ key: networkKey });
            if (localNetwork) {
                networkName = localNetwork.name;
                networkColor = localNetwork.color;
            }
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
