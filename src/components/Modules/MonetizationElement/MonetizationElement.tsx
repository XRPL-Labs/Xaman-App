import React, { PureComponent } from 'react';
import { InteractionManager, StyleProp, Text, View, ViewStyle } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { ProfileRepository } from '@store/repositories';
import { MonetizationStatus } from '@store/types';

import { PurchaseProductOverlayProps } from '@screens/Overlay/PurchaseProduct';

import { Button } from '@components/General';

import Localize from '@locale';

import styles from './styles';
/* Types ==================================================================== */
interface Props {
    style: StyleProp<ViewStyle> | undefined;
}

interface State {
    monetizationStatus: MonetizationStatus;
    productForPurchase?: string;
    monetizationType?: string;
}
/* Component ==================================================================== */
class MonetizationElement extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            monetizationStatus: MonetizationStatus.NONE,
            productForPurchase: undefined,
            monetizationType: undefined,
        };
    }

    componentDidMount() {
        // get the has pro status
        InteractionManager.runAfterInteractions(this.getMonetizationStatus);

        // update monetization status
        ProfileRepository.on('profileUpdate', this.getMonetizationStatus);
    }

    componentWillUnmount() {
        ProfileRepository.off('profileUpdate', this.getMonetizationStatus);
    }

    getMonetizationStatus = () => {
        const profile = ProfileRepository.getProfile();

        // no profile found
        if (!profile) {
            return;
        }

        const { monetization } = profile;

        this.setState({
            monetizationStatus: monetization.monetizationStatus,
            productForPurchase: monetization.productForPurchase,
            monetizationType: monetization.monetizationType,
        });
    };

    onSuccessPurchase = () => {};

    onPurchaseProductClose = () => {};

    purchaseProduct = () => {
        const { productForPurchase, monetizationType } = this.state;

        Navigator.showOverlay<PurchaseProductOverlayProps>(AppScreens.Overlay.PurchaseProduct, {
            productId: productForPurchase!,
            productDescription: monetizationType!,
            onSuccessPurchase: this.onSuccessPurchase,
            onClose: this.onPurchaseProductClose,
        });
    };

    renderPaymentComingUp = () => {
        const { style } = this.props;

        return (
            <View style={[styles.container, styles.containerComingUp, style]}>
                <Text style={styles.messageText}>{Localize.t('monetization.comingPaymentWarning')}</Text>
                <Button roundedSmallBlock contrast label="Pay now" onPress={this.purchaseProduct} />
            </View>
        );
    };

    renderPaymentRequired = () => {
        const { style } = this.props;

        return (
            <View style={[styles.container, styles.containerRequired, style]}>
                <Text style={styles.messageText}>{Localize.t('monetization.paymentRequired')}</Text>
                <Button roundedSmallBlock contrast label="Payment CTA" onPress={this.purchaseProduct} />
            </View>
        );
    };

    render() {
        const { monetizationStatus } = this.state;

        switch (monetizationStatus) {
            case MonetizationStatus.COMING_UP:
                return this.renderPaymentComingUp();
            case MonetizationStatus.REQUIRED:
                return this.renderPaymentRequired();
            default:
                return null;
        }
    }
}

export default MonetizationElement;
