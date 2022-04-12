import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { AmountText, Icon, Avatar } from '@components/General';

import { CalculateAvailableBalance } from '@common/utils/balance';

import { AccountSchema } from '@store/schemas/latest';

import { AppStyles, AppSizes } from '@theme';
import { Images } from '@common/helpers/images';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountSchema;
    discreetMode: boolean;
    onPress: () => void;
}

/* Component ==================================================================== */
class NativeItem extends PureComponent<Props> {
    static Height = AppSizes.scale(50);

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    getAvatar = () => {
        return (
            <Avatar border size={35} imageScale={0.8} source={Images.IconXrpNew} containerStyle={styles.brandAvatar} />
        );
    };

    renderBalance = () => {
        const { account, discreetMode } = this.props;

        const availableBalance = CalculateAvailableBalance(account, true);

        return (
            <AmountText
                // eslint-disable-next-line react/no-unstable-nested-components
                prefix={() => (
                    <View style={styles.currencyAvatarContainer}>
                        <Icon
                            size={12}
                            style={[styles.currencyAvatar, discreetMode && AppStyles.imgColorGrey]}
                            name="IconXrp"
                        />
                    </View>
                )}
                value={availableBalance}
                style={[styles.balanceText]}
                discreet={discreetMode}
                discreetStyle={AppStyles.colorGrey}
            />
        );
    };

    render() {
        return (
            <View testID="xrp-currency" style={[styles.currencyItem, { height: NativeItem.Height }]}>
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[styles.brandAvatarContainer]}>{this.getAvatar()}</View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text numberOfLines={1} style={[styles.currencyItemLabelSmall]}>
                            XRP
                        </Text>
                    </View>
                </View>
                <View
                    style={[
                        AppStyles.flex1,
                        AppStyles.row,
                        AppStyles.centerContent,
                        AppStyles.centerAligned,
                        AppStyles.flexEnd,
                    ]}
                >
                    {this.renderBalance()}
                </View>
            </View>
        );
    }
}

export default NativeItem;
