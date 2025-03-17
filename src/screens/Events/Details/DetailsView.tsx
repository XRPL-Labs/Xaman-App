/**
 * Transaction Details screen
 */
import { EventSubscription, Navigation } from 'react-native-navigation';

import React, { Component } from 'react';
import { View, Alert, Linking, Platform, ScrollView, Share, InteractionManager } from 'react-native';

import LoggerService from '@services/LoggerService';
import BackendService from '@services/BackendService';
import StyleService from '@services/StyleService';
import { ComponentTypes } from '@services/NavigationService';

import { ExplainerFactory } from '@common/libs/ledger/factory';

import { AppScreens } from '@common/constants';

import { ActionSheet } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { GetTransactionLink } from '@common/utils/explorer';

import { Header } from '@components/General';

import * as MutationWidgets from '@components/Modules/MutationWidgets';

import Localize from '@locale';

import { AppStyles } from '@theme';
/* types ==================================================================== */
import { Props, State, WidgetComponents, WidgetKey } from './types';
import { InstanceTypes } from '@common/libs/ledger/types/enums';

/* Component ==================================================================== */
class TransactionDetailsView extends Component<Props & { componentType: ComponentTypes }, State> {
    static screenName = AppScreens.Transaction.Details;

    private navigationListener?: EventSubscription;
    private mounted = false;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props & { componentType: ComponentTypes }) {
        super(props);

        this.state = {
            advisory: undefined,
            explainer: ExplainerFactory.fromInstance(props.item, props.account),
        };
    }

    componentDidMount() {
        this.mounted = true;

        this.navigationListener = Navigation.events().bindComponent(this);

        InteractionManager.runAfterInteractions(this.checkAdvisory);
    }

    componentWillUnmount() {
        this.mounted = false;

        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    close = () => {
        const { componentType } = this.props;

        switch (componentType) {
            case ComponentTypes.Modal:
                Navigator.dismissModal();
                break;
            case ComponentTypes.Screen:
                Navigator.pop();
                break;
            default:
                throw new Error('Component can only be presented as Modal or Screen');
        }
    };

    checkAdvisory = async () => {
        const { item, account } = this.props;

        // no need to check as the account is the initiator of the transaction
        if (item.Account === account.address) {
            return;
        }

        BackendService.getAccountAdvisory(item.Account)
            .then((resp) => {
                if (resp?.danger && this.mounted) {
                    this.setState({
                        advisory: resp.danger,
                    });
                }
            })
            .catch((error) => {
                LoggerService.recordError('AdvisoryAlertWidget checkAdvisory error', error);
            });
    };

    getItemLink = (): string | undefined => {
        const { item } = this.props;

        // only validated transactions have CTID
        // Regular transactions
        if (
            item.InstanceType === InstanceTypes.GenuineTransaction ||
            item.InstanceType === InstanceTypes.FallbackTransaction
        ) {
            return GetTransactionLink(item.CTID);
        }
        
        // E.g. offers, NFT offers, etc.
        if (item?.PreviousTxnID) {
            return GetTransactionLink(item.PreviousTxnID);
        }

        return undefined;
    };

    shareTxLink = (): void => {
        const url = this.getItemLink();

        if (url) {
            Share.share({
                title: Localize.t('events.shareTransactionId'),
                message: url,
                url: undefined,
            }).catch(() => {});
        }
    };

    openExplorerLink = (): void => {
        const url = this.getItemLink();

        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            });
        }
    };

    showMenu = () => {
        // TODO: check what you are going to do with ledger objects
        ActionSheet(
            {
                options: Platform.select({
                    ios: [Localize.t('global.share'), Localize.t('global.openInBrowser'), Localize.t('global.cancel')],
                    default: [Localize.t('global.share'), Localize.t('global.openInBrowser')],
                }),
                cancelButtonIndex: 2,
            },
            (buttonIndex: number) => {
                if (buttonIndex === 0) {
                    this.shareTxLink();
                }
                if (buttonIndex === 1) {
                    this.openExplorerLink();
                }
            },
            StyleService.isDarkMode() ? 'dark' : 'light',
        );
    };

    render() {
        const { account, item, componentType, cachedTokenDetails, timestamp } = this.props;
        const { advisory, explainer } = this.state;

        const widgetsList: WidgetKey[] = [
            'LabelWidget',
            'AssetsMutationsWidget',
            'MemoWidget',
            'ReserveChangeWidget',
            'ParticipantsWidget',
            'ActionButtonsWidget',
            'WarningsWidget',
            'IdentifierWidget',
            'ExplainWidget',
            'FlagsWidget',
            'InvoiceIdWidget',
            'HookDetailsWidget',
            'FeeWidget',
            'TransferRateWidget',
            'ValidatedLedgerWidget',
        ];

        return (
            <View key={`txdetailsview-${timestamp}`} style={AppStyles.container}>
                <Header
                    leftComponent={{ icon: 'IconChevronLeft', onPress: this.close }}
                    centerComponent={{ text: Localize.t('events.transactionDetails') }}
                    rightComponent={
                        this.getItemLink()
                            ? { icon: 'IconMoreHorizontal', onPress: this.showMenu }
                            : undefined
                    }
                    // eslint-disable-next-line react-native/no-inline-styles
                    containerStyle={componentType === ComponentTypes.Modal ? { marginTop: 0 } : {}}
                />

                <MutationWidgets.AdvisoryAlertWidget
                    item={item}
                    account={account}
                    advisory={advisory}
                    explainer={explainer}
                    componentType={componentType}
                />

                <ScrollView>
                    {widgetsList.map((widget: WidgetKey, index) => {
                        return React.createElement((MutationWidgets as WidgetComponents)[widget], {
                            key: index,
                            item,
                            account,
                            explainer,
                            advisory,
                            componentType,
                            cachedTokenDetails,
                        });
                    })}
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TransactionDetailsView;
