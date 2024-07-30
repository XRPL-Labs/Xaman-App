import React, { PureComponent } from 'react';
import { InteractionManager, StyleProp, Text, View, ViewStyle } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { ProfileRepository, UserInteractionRepository } from '@store/repositories';
import { MonetizationStatus } from '@store/types';
import { InteractionTypes } from '@store/models/objects/userInteraction';

import { PurchaseProductOverlayProps } from '@screens/Overlay/PurchaseProduct';

import { Button, RaisedButton } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    style: StyleProp<ViewStyle> | undefined;
    canSuppressWarnings?: boolean;
}

interface State {
    suppressComingUpWarning: boolean;
    monetizationStatus: MonetizationStatus;
    productForPurchase?: string;
    monetizationType?: string;
}
/* Component ==================================================================== */
class MonetizationElement extends PureComponent<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof MonetizationElement.defaultProps>>;

    static defaultProps: Partial<Props> = {
        canSuppressWarnings: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            suppressComingUpWarning: false,
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
        const suppressComingUpWarning = UserInteractionRepository.getInteractionValue(
            InteractionTypes.MONETIZATION,
            'suppress_warning_on_home_screen',
        );

        // no profile found
        if (!profile) {
            return;
        }

        const { monetization } = profile;

        this.setState({
            suppressComingUpWarning,
            monetizationStatus: monetization.monetizationStatus,
            productForPurchase: monetization.productForPurchase,
            monetizationType: monetization.monetizationType,
        });
    };

    onSuccessPurchase = () => {
        // purchase was successful clear the monetization status
        ProfileRepository.saveProfile({
            monetization: {
                monetizationStatus: MonetizationStatus.NONE,
            },
        });
    };

    purchaseProduct = () => {
        const { productForPurchase, monetizationType } = this.state;

        Navigator.showOverlay<PurchaseProductOverlayProps>(AppScreens.Overlay.PurchaseProduct, {
            productId: productForPurchase!,
            productDescription: monetizationType!,
            onSuccessPurchase: this.onSuccessPurchase,
        });
    };

    suppressWarningMessage = () => {
        UserInteractionRepository.updateInteraction(InteractionTypes.MONETIZATION, {
            suppress_warning_on_home_screen: true,
        });

        this.setState({
            suppressComingUpWarning: true,
        });
    };

    renderPaymentComingUp = () => {
        const { canSuppressWarnings, style } = this.props;
        const { suppressComingUpWarning } = this.state;

        if (canSuppressWarnings && suppressComingUpWarning) {
            return null;
        }

        return (
            <View style={[styles.container, styles.containerComingUp, style]}>
                <Text style={styles.messageTitle}>{Localize.t('monetization.thankYouForUsingXaman')}</Text>
                <Text style={styles.messageText}>{Localize.t('monetization.comingPaymentWarning')}</Text>
                {canSuppressWarnings && (
                    <Button
                        roundedSmallBlock
                        style={styles.okButton}
                        textStyle={styles.okButtonText}
                        label={Localize.t('global.ok')}
                        onPress={this.suppressWarningMessage}
                    />
                )}
            </View>
        );
    };

    renderPaymentRequired = () => {
        const { style } = this.props;

        return (
            <View style={[styles.container, styles.containerRequired, style]}>
                <Text style={styles.messageText}>{Localize.t('monetization.paymentRequiredMessage')}</Text>
                <View style={AppStyles.row}>
                    <RaisedButton
                        small
                        onPress={this.purchaseProduct}
                        label={Localize.t('monetization.learnMore')}
                        containerStyle={styles.actionButtonContainer}
                        textStyle={styles.actionButtonLabel}
                    />
                </View>
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
