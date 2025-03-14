import BigNumber from 'bignumber.js';

import React, { PureComponent } from 'react';
import { InteractionManager, Text, View } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import NetworkService from '@services/NetworkService';

import { InstanceTypes, LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { OperationActions, OwnerCountChangeType } from '@common/libs/ledger/parser/types';

import { Button, Icon } from '@components/General';

import Localize from '@locale';

import { ExplainBalanceOverlayProps } from '@screens/Overlay/ExplainBalance';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

interface State {
    value?: string;
    action?: OperationActions;
}

/* Component ==================================================================== */
class ReserveChange extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            value: undefined,
            action: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setOwnerReserveChanges);
    }

    setOwnerReserveChanges = () => {
        const { item } = this.props;

        let ownerReserveChanges: OwnerCountChangeType | undefined;

        switch (item.InstanceType) {
            case InstanceTypes.LedgerObject:
                ownerReserveChanges = this.getLedgerObjectChanges();
                break;
            case InstanceTypes.GenuineTransaction:
            case InstanceTypes.FallbackTransaction:
                ownerReserveChanges = this.getTransactionChanges();
                break;
            default:
                break;
        }

        if (ownerReserveChanges) {
            this.setState({
                value: new BigNumber(NetworkService.getNetworkReserve().OwnerReserve)
                    .multipliedBy(ownerReserveChanges.value)
                    .toString(),
                action: ownerReserveChanges.action,
            });
        }
    };

    showBalanceExplain = () => {
        const { account } = this.props;

        // don't show the explain screen when account is not activated
        // Deleted accounts still have transaction history
        if (account.balance === 0) {
            return;
        }

        Navigator.showOverlay<ExplainBalanceOverlayProps>(AppScreens.Overlay.ExplainBalance, { account });
    };

    getLedgerObjectChanges = (): OwnerCountChangeType | undefined => {
        const { item, account } = this.props;

        // ignore for incoming NFTokenOffers and URITokenOffers
        if (
            (item.Type === LedgerEntryTypes.NFTokenOffer || item.Type === LedgerEntryTypes.URIToken) &&
            item.Owner !== account.address
        ) {
            return undefined;
        }

        if (item.Type === LedgerEntryTypes.Escrow || item.Type === LedgerEntryTypes.Check) {
            if (item.Account !== account.address) {
                return undefined;
            }
        }
        // ledger objects always have reserve change increase
        return {
            address: account.address,
            value: 1,
            action: OperationActions.INC,
        };
    };

    getTransactionChanges = (): OwnerCountChangeType => {
        const { item, account }: { item: any; account: any } = this.props;

        return item.OwnerCountChange(account.address);
    };

    render() {
        const { value, action } = this.state;

        if (!value || !action) {
            return null;
        }

        return (
            <View style={styles.itemContainer}>
                <View style={AppStyles.row}>
                    <Icon
                        name={action === OperationActions.INC ? 'IconLock' : 'IconUnlock'}
                        size={18}
                        style={AppStyles.imgColorPrimary}
                    />
                    <Text style={styles.detailsLabelText}> {Localize.t('global.reserve')}</Text>
                </View>

                <View style={AppStyles.paddingBottomSml}>
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {action === OperationActions.INC
                            ? Localize.t('events.thisTransactionIncreaseAccountReserve', {
                                  ownerReserve: value,
                                  nativeAsset: NetworkService.getNativeAsset(),
                              })
                            : Localize.t('events.thisTransactionDecreaseAccountReserve', {
                                  ownerReserve: value,
                                  nativeAsset: NetworkService.getNativeAsset(),
                              })}
                    </Text>
                </View>
                <Button
                    roundedMini
                    // light
                    label={Localize.t('events.myBalanceAndReserve')}
                    onPress={this.showBalanceExplain}
                />
            </View>
        );
    }
}

export default ReserveChange;
