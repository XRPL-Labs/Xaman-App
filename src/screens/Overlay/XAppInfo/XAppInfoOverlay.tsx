/**
 * XApp Info Screen
 */
import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager, ScrollView } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import BackendService from '@services/BackendService';
import NetworkService from '@services/NetworkService';

// components
import { Button, Spacer, TextPlaceholder, ActionPanel, Avatar } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
type XAppInfo = {
    description: string;
    supportUrl: string;
    websiteUrl: string;
    donation: boolean;
};
export interface Props {
    title: string;
    icon: string;
    identifier: string;
    onDonationPress: (amount?: number) => void;
}

export interface State {
    isLoading: boolean;
    info: XAppInfo;
}

/* Component ==================================================================== */
class XAppInfoOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.XAppInfo;

    private mounted: boolean;
    private actionPanelRef: React.RefObject<ActionPanel>;

    static options() {
        return {
            statusBar: {
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
            isLoading: true,
            info: undefined,
        };

        this.actionPanelRef = React.createRef();
    }

    componentDidMount() {
        // fetch the info
        InteractionManager.runAfterInteractions(this.fetchXAppInfo);

        // track mount status
        this.mounted = true;
    }

    componentWillUnmount() {
        // track mount status
        this.mounted = false;
    }

    fetchXAppInfo = () => {
        const { identifier } = this.props;

        BackendService.getXAppInfo(identifier)
            .then((res: any) => {
                if (res && !res?.error && this.mounted) {
                    this.setState({
                        isLoading: false,
                        info: res,
                    });
                }
            })
            .catch(() => {
                if (this.mounted) {
                    Alert.alert(Localize.t('global.error'), Localize.t('xapp.unableToFetchXAppInfo'));
                }
            });
    };

    onClosePress = () => {
        if (this.actionPanelRef?.current) {
            this.actionPanelRef.current.slideDown();
        }
    };

    onDonationPress = (amount?: number) => {
        const { onDonationPress } = this.props;

        // close the overlay and load the donation xapp
        this.onClosePress();

        // callback
        if (typeof onDonationPress === 'function') {
            onDonationPress(amount);
        }
    };

    renderDonationButton = () => {
        const { info } = this.state;

        if (!info?.donation) {
            return null;
        }

        return (
            <View style={[AppStyles.paddingExtraSml, AppStyles.leftAligned]}>
                <Text style={styles.headerText}>☕ &nbsp;{Localize.t('xapp.donateToTheCreator')}</Text>
                <Spacer />
                <View style={AppStyles.row}>
                    <Button
                        roundedMini
                        secondary
                        label={`5 ${NetworkService.getNativeAsset()}`}
                        // eslint-disable-next-line react/jsx-no-bind
                        onPress={this.onDonationPress.bind(null, 5)}
                    />
                    <Button
                        roundedMini
                        secondary
                        label={`10 ${NetworkService.getNativeAsset()}`}
                        // eslint-disable-next-line react/jsx-no-bind
                        onPress={this.onDonationPress.bind(null, 10)}
                        style={styles.donationButton}
                    />
                    <Button
                        roundedMini
                        contrast
                        label={Localize.t('xapp.chooseAmount')}
                        onPress={this.onDonationPress}
                        style={styles.donationButton}
                    />
                </View>
            </View>
        );
    };

    renderDetails = () => {
        const { info, isLoading } = this.state;

        return (
            <>
                <View style={[AppStyles.paddingExtraSml, AppStyles.leftAligned]}>
                    <Text style={styles.headerText}>📝&nbsp;{Localize.t('global.description')}</Text>
                    <Spacer />
                    <TextPlaceholder selectable isLoading={isLoading} style={styles.contentText} length={200}>
                        {info?.description}
                    </TextPlaceholder>
                </View>

                <View style={[AppStyles.paddingExtraSml, AppStyles.leftAligned]}>
                    <Text style={styles.headerText}>👨‍💻&nbsp;{Localize.t('global.details')}</Text>
                    <Spacer />
                    <TextPlaceholder isLoading={isLoading} style={styles.contentTextHeader} length={40}>
                        {Localize.t('xapp.projectHomePage')}
                    </TextPlaceholder>
                    <TextPlaceholder selectable isLoading={isLoading} style={styles.contentText} length={30}>
                        {info?.websiteUrl}
                    </TextPlaceholder>
                </View>

                <View style={[AppStyles.paddingExtraSml, AppStyles.leftAligned]}>
                    <Text style={styles.headerText}>🙋&nbsp;{Localize.t('xapp.supportAndQuestions')}</Text>
                    <Spacer />
                    <TextPlaceholder isLoading={isLoading} style={styles.contentTextHeader} length={40}>
                        {Localize.t('xapp.website')}
                    </TextPlaceholder>
                    <TextPlaceholder selectable isLoading={isLoading} style={styles.contentText} length={30}>
                        {info?.supportUrl}
                    </TextPlaceholder>
                </View>
            </>
        );
    };

    renderHeader = () => {
        const { icon, title } = this.props;

        return (
            <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                <View style={styles.headerLeftContainer}>
                    <Avatar source={{ uri: icon }} size={30} />
                    <Text style={styles.titleText}>{title}</Text>
                </View>
                <View style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}>
                    <Button
                        light
                        roundedSmall
                        isDisabled={false}
                        onPress={this.onClosePress}
                        textStyle={[AppStyles.subtext, AppStyles.bold]}
                        label={Localize.t('global.close')}
                    />
                </View>
            </View>
        );
    };

    render() {
        return (
            <ActionPanel
                height={AppSizes.heightPercentageToDP(80)}
                onSlideDown={Navigator.dismissOverlay}
                testID="xapp-info-overlay"
                ref={this.actionPanelRef}
            >
                {this.renderHeader()}
                <ScrollView>
                    {this.renderDetails()}
                    {this.renderDonationButton()}
                </ScrollView>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default XAppInfoOverlay;
