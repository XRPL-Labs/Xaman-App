import React, { PureComponent } from 'react';
import { Image } from 'react-native';

import { OperationActions, OwnerCountChangeType } from '@common/libs/ledger/parser/types';

import NetworkService from '@services/NetworkService';

import { Images } from '@common/helpers/images';
import { Icon } from '@components/General';

import { InstanceTypes } from '@common/libs/ledger/types/enums';

import { AppStyles } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';

interface IProps extends Pick<Props, 'item' | 'account'> {}
/* Component ==================================================================== */
class IndicatorIconBlock extends PureComponent<IProps> {
    renderXAppIndicator = () => {
        return <Image source={Images.IconXApp} style={styles.xAppsIcon} />;
    };

    renderMemoIndicator = () => {
        const { item } = this.props;

        if (
            (item.InstanceType === InstanceTypes.GenuineTransaction ||
                InstanceTypes.FallbackTransaction === item.InstanceType) &&
            typeof item.Memos !== 'undefined'
        ) {
            return <Icon name="IconFileText" style={[AppStyles.imgColorGrey, AppStyles.paddingLeftSml]} size={12} />;
        }

        return null;
    };

    renderReserveIndicator = () => {
        const { item, account } = this.props;

        let ownerCountChanges: OwnerCountChangeType | undefined;

        if (
            item.InstanceType === InstanceTypes.GenuineTransaction ||
            InstanceTypes.FallbackTransaction === item.InstanceType
        ) {
            ownerCountChanges = item.OwnerCountChange(account.address);
        } else if (item.InstanceType === InstanceTypes.LedgerObject) {
            ownerCountChanges = {
                address: item.Account,
                value: NetworkService.getNetworkReserve().OwnerReserve,
                action: OperationActions.INC,
            };
        }

        if (ownerCountChanges) {
            return (
                <Icon
                    name={ownerCountChanges.action === OperationActions.INC ? 'IconLock' : 'IconUnlock'}
                    style={[AppStyles.imgColorGrey, AppStyles.paddingLeftSml]}
                    size={12}
                />
            );
        }

        return null;
    };

    render() {
        const { item } = this.props;

        // if memo contain xApp identifier then show xApp Icon
        if (
            (item.InstanceType === InstanceTypes.GenuineTransaction ||
                InstanceTypes.FallbackTransaction === item.InstanceType) &&
            item.getXappIdentifier()
        ) {
            return this.renderXAppIndicator();
        }

        return (
            <>
                {this.renderMemoIndicator()}
                {this.renderReserveIndicator()}
            </>
        );
    }
}

export default IndicatorIconBlock;
