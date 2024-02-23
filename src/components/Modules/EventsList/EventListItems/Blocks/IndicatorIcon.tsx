import React, { PureComponent } from 'react';
import { Image } from 'react-native';

import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';
import { OperationActions } from '@common/libs/ledger/parser/types';

import { Images } from '@common/helpers/images';

import { Icon } from '@components/General';

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

        if (item instanceof BaseTransaction && typeof item.Memos !== 'undefined') {
            return <Icon name="IconFileText" style={[AppStyles.imgColorGrey, AppStyles.paddingLeftSml]} size={12} />;
        }

        return null;
    };

    renderReserveIndicator = () => {
        const { item, account } = this.props;

        const ownerCountChanges = item.OwnerCountChange(account.address);

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
        if (item.getXappIdentifier()) {
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
