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

import { AccountModel } from '@store/models';

import { BaseTransaction } from '@common/libs/ledger/transactions';
import { Transactions, PseudoTransactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

import { ExplainerFactory } from '@common/libs/ledger/factory';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

import { AppScreens } from '@common/constants';

import { ActionSheet } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { GetTransactionLink } from '@common/utils/explorer';

import { Header } from '@components/General';

import * as MutationWidgets from '@components/Modules/MutationWidgets';
import { Props as MutationWidgetProps } from '@components/Modules/MutationWidgets/types';

import Localize from '@locale';

import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {
    item: (Transactions | LedgerObjects) & MutationsMixinType;
    account: AccountModel;
}

export interface State {
    advisory?: string;
    explainer?: ExplainerAbstract<Transactions | PseudoTransactions | LedgerObjects>;
}

type WidgetKey = keyof typeof MutationWidgets;
type WidgetComponents = {
    [key in WidgetKey]: React.ComponentClass<MutationWidgetProps>;
};

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
            explainer: ExplainerFactory.fromItem(props.item, props.account),
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
        if (item instanceof BaseTransaction) {
            return GetTransactionLink(item.CTID);
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
        const { account, item, componentType } = this.props;
        const { advisory, explainer } = this.state;

        const widgetsList: WidgetKey[] = [
            'LabelWidget',
            'TransferredAssetsWidget',
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
            'ValidatedLedgerWidget',
        ];

        return (
            <View style={AppStyles.container}>
                <Header
                    leftComponent={{ icon: 'IconChevronLeft', onPress: this.close }}
                    centerComponent={{ text: Localize.t('events.transactionDetails') }}
                    rightComponent={{ icon: 'IconMoreHorizontal', onPress: this.showMenu }}
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
                            componentType,
                        });
                    })}
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TransactionDetailsView;
