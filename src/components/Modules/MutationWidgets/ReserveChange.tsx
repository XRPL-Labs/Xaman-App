import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import NetworkService from '@services/NetworkService';

import { BaseLedgerObject } from '@common/libs/ledger/objects';
import { BaseTransaction } from '@common/libs/ledger/transactions';

import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { OperationActions, OwnerCountChangeType } from '@common/libs/ledger/parser/types';

import { Button, Icon } from '@components/General';

import Localize from '@locale';

import { ExplainBalanceOverlayProps } from '@screens/Overlay/ExplainBalance';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

/* Component ==================================================================== */
class ReserveChange extends PureComponent<Props> {
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

        // ignore for incoming NFTokenOffers
        if (item.Type === LedgerEntryTypes.NFTokenOffer && item.Owner !== account.address) {
            return undefined;
        }

        // ledger objects always have reserve change increase
        return {
            address: account.address,
            value: 1,
            action: OperationActions.INC,
        };
    };

    getTransactionChanges = (): OwnerCountChangeType => {
        const { item, account } = this.props;

        return item.OwnerCountChange(account.address);
    };

    render() {
        const { item } = this.props;

        let changes;

        switch (true) {
            case item instanceof BaseLedgerObject:
                changes = this.getLedgerObjectChanges();
                break;
            case item instanceof BaseTransaction:
                changes = this.getTransactionChanges();
                break;
            default:
                break;
        }

        if (!changes) {
            return null;
        }

        return (
            <View style={styles.itemContainer}>
                <View style={AppStyles.row}>
                    <Icon
                        name={changes.action === OperationActions.INC ? 'IconLock' : 'IconUnlock'}
                        size={18}
                        style={AppStyles.imgColorPrimary}
                    />
                    <Text style={styles.detailsLabelText}> {Localize.t('global.reserve')}</Text>
                </View>

                <View style={AppStyles.paddingBottomSml}>
                    <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                        {changes.action === OperationActions.INC
                            ? Localize.t('events.thisTransactionIncreaseAccountReserve', {
                                  ownerReserve: Number(changes.value) * NetworkService.getNetworkReserve().OwnerReserve,
                                  nativeAsset: NetworkService.getNativeAsset(),
                              })
                            : Localize.t('events.thisTransactionDecreaseAccountReserve', {
                                  ownerReserve: Number(changes.value) * NetworkService.getNetworkReserve().OwnerReserve,
                                  nativeAsset: NetworkService.getNativeAsset(),
                              })}
                    </Text>
                </View>
                <Button
                    roundedSmall
                    secondary
                    label={Localize.t('events.myBalanceAndReserve')}
                    onPress={this.showBalanceExplain}
                />
            </View>
        );
    }
}

export default ReserveChange;
