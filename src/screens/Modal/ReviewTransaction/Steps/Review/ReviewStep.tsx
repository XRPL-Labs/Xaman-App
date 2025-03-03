/**
 * Review Step
 */

import { get } from 'lodash';
import React, { Component } from 'react';
import { ImageBackground, View } from 'react-native';

import { StyleService } from '@services';

// components
import { KeyboardAwareScrollView, SwipeButton } from '@components/General';
import { AccountPicker } from '@components/Modules';

import { InstanceTypes } from '@common/libs/ledger/types/enums';

import { AppInfo, SignerLabel, SignForAccount } from '@components/Modules/ReviewTransaction';
import { ReviewHeader } from '@screens/Modal/ReviewTransaction/Shared';
import DropShadow from 'react-native-drop-shadow';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

// transaction templates
import * as GenuineTransactionTemplates from './Templates/genuine';
import * as PseudoTransactionTemplates from './Templates/pseudo';
import { FallbackTemplate } from './Templates/fallback';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    canScroll: boolean;
    timestamp?: number;
    serviceFee?: number;
}

/* Component ==================================================================== */
class ReviewStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        // console.log('Reviewstep')

        this.state = {
            canScroll: true,
        };
    }

    toggleCanScroll = () => {
        const { canScroll } = this.state;
        
        // console.log('ToggleCanScroll')
        
        this.setState({
            canScroll: !canScroll,
        });
    };

    getSwipeButtonColor = (): string | undefined => {
        const { coreSettings } = this.context;

        if (coreSettings?.developerMode && coreSettings?.network) {
            return coreSettings.network.color;
        }

        return undefined;
    };

    forceRender = () => {
        this.setState({
            // eslint-disable-next-line react/no-unused-state
            timestamp: +new Date(),
        });
    };

    setServiceFee = (serviceFee: number) => {
        // console.log('ReviewStep set service fee', serviceFee)
        this.setState({
            serviceFee,
        });
    };

    renderDetails = () => {
        const { payload, transaction, source, setLoading, setReady } = this.context;

        if (!transaction) {
            return null;
        }

        const Components = [];
        const Props = {
            source,
            transaction,
            payload,
            forceRender: this.forceRender,
            setLoading,
            setReady,
            setServiceFee: this.setServiceFee,
        } as any;

        // TODO: add logic for checking if template is exist before calling React.createElement

        switch (transaction.InstanceType) {
            case InstanceTypes.PseudoTransaction:
                Components.push(
                    React.createElement(get(PseudoTransactionTemplates, String(transaction.Type)), {
                        ...Props,
                        key: `${transaction.Type}Template`,
                    }),
                );
                break;
            case InstanceTypes.GenuineTransaction:
                Components.push(
                    React.createElement(get(GenuineTransactionTemplates, String(transaction.Type)), {
                        ...Props,
                        key: `${transaction!.Type}Template`,
                    }),
                    React.createElement(get(GenuineTransactionTemplates, 'Global'), {
                        ...Props,
                        key: 'GlobalTemplate',
                    }),
                );
                break;
            case InstanceTypes.FallbackTransaction:
                Components.push(
                    React.createElement(FallbackTemplate, {
                        ...Props,
                        key: `${transaction!.Type}Template`,
                    }),
                );
                break;
            default:
                break;
        }

        return Components;
    };

    render() {
        const {
            accounts,
            payload,
            transaction,
            source,
            isReady,
            isLoading,
            setSource,
            onAccept,
            onClose,
            setServiceFee,
        } = this.context;
        const { canScroll, serviceFee } = this.state;

        if (serviceFee) {
            setServiceFee(serviceFee);
        }

        // waiting for accounts / transaction to be initiated
        if (typeof accounts === 'undefined' || !source || !transaction) {
            return null;
        }

        return (
            <ImageBackground
                testID="review-transaction-modal"
                source={StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes')}
                imageStyle={styles.xamanAppBackground}
                resizeMode="cover"
                style={styles.container}
            >
                <ReviewHeader transaction={transaction} onClose={onClose} />
                <KeyboardAwareScrollView
                    testID="review-content-container"
                    contentContainerStyle={styles.keyboardAvoidContainerStyle}
                    style={AppStyles.flex1}
                    scrollEnabled={canScroll}
                >
                    {/* App info */}
                    <AppInfo source={source} transaction={transaction} payload={payload} />

                    {/* transaction info content */}
                    <DropShadow style={styles.shadow}>
                        <View style={styles.transactionContent}>
                            <View style={AppStyles.paddingHorizontalSml}>
                                <SignerLabel payload={payload} />
                                <View style={styles.accountPickerPadding}>
                                    <AccountPicker
                                        onSelect={setSource}
                                        accounts={accounts}
                                        selectedItem={source}
                                    />
                                </View>
                            </View>

                            {/* in multi-sign transactions and in some cases in Import transaction */}
                            {/* the Account can be different than the signing account */}
                            <SignForAccount transaction={transaction} source={source} />

                            {/* transaction details */}
                            <View style={styles.detailsContainer}>{this.renderDetails()}</View>
                            
                            {/* accept button */}
                            <View style={styles.acceptButtonContainer}>
                                <SwipeButton
                                    testID="accept-button"
                                    color={this.getSwipeButtonColor()}
                                    isLoading={isLoading}
                                    isDisabled={!isReady}
                                    onSwipeSuccess={onAccept}
                                    label={Localize.t('global.slideToAccept')}
                                    accessibilityLabel={Localize.t('global.accept')}
                                    onPanResponderGrant={this.toggleCanScroll}
                                    onPanResponderRelease={this.toggleCanScroll}
                                    shouldResetAfterSuccess
                                />
                            </View>
                        </View>
                    </DropShadow>
                </KeyboardAwareScrollView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewStep;
