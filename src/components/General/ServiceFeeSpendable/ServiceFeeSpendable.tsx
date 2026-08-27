import React, { Component } from 'react';
import {
    View,
    Text,
    ViewStyle,
    // Platform,
    // TextStyle,
    // ViewStyle,
} from 'react-native';

// import { AppColors } from '@theme';
import styles from './styles';
import { Spacer } from '../Spacer';
import Localize from '@locale';

import NetworkService from '@services/NetworkService';
import { Button } from '../Button';
import { AppStyles } from '@theme/index';
import { Icon } from '../Icon';
import { TouchableDebounce } from '../TouchableDebounce';

/* Types ==================================================================== */
interface Props {
    txType?: string;
    spendableBalanceDrops: number;
    serviceFeeDrops: number;
    txFeeDrops: number;
    sendAmountDrops?: number;
    onTxMaySend?: (canSend: boolean) => void;
    updateSendingAmountDrops?: (amount: number) => void;
    autoUpdateOnTxFeeChange?: boolean;
    // testID?: string;
    // title?: string;
    // titleStyle?: TextStyle;
    style?: ViewStyle | ViewStyle[];
    // direction?: 'right' | 'left';
    // checked: boolean;
    // isDisabled?: boolean;
    // onChange: (value: boolean) => void;
}

interface State {
    didUpdate: boolean;
    touchedCount: number;
}

/* Component ==================================================================== */
class ServiceFeeSpendable extends Component<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof ServiceFeeSpendable.defaultProps>>;

    static defaultProps: Partial<Props> = {
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            didUpdate: false,
            touchedCount: 0,
        };
    }

    componentDidMount() {
        // listen for changes
    }

    componentWillUnmount() {
        // remove listener
    }

    postTxRemainingDrops = () => {
        const {
            spendableBalanceDrops,
            serviceFeeDrops,
            sendAmountDrops,
            txFeeDrops,
        } = this.props;

        const dropsRequired = (sendAmountDrops || 0) +
            serviceFeeDrops +
            txFeeDrops;
        
        // TODO: non XRP

        return spendableBalanceDrops - dropsRequired;
    };

    canSendFee = () => {
        const {
            onTxMaySend,
            autoUpdateOnTxFeeChange,
            sendAmountDrops,
            spendableBalanceDrops,
            txFeeDrops,
            serviceFeeDrops,
        } = this.props;
        const { didUpdate } = this.state;

        if (onTxMaySend) {
            requestAnimationFrame(() => {
                onTxMaySend(this.postTxRemainingDrops() >= 0);
                // ^^ can be part of the render process so we're taking the next frame
            });
        }

        const canSend = this.postTxRemainingDrops() >= 0;

        if (
            !canSend &&
            didUpdate &&
            autoUpdateOnTxFeeChange &&
            sendAmountDrops !== (spendableBalanceDrops - txFeeDrops - serviceFeeDrops)
        ) {
            this.updateSendingAmount();
        }
    
        return canSend;
    };

    enforceFeeAvailability = () => {
        const {
            sendAmountDrops,
            onTxMaySend,
            // updateSendingAmountDrops,
            serviceFeeDrops,
            txType,
        } = this.props;
        const {
            touchedCount,
        } = this.state;

        if (
            touchedCount < 3 &&
            (typeof sendAmountDrops === 'number' && sendAmountDrops > 0) &&
            // ^^ ONLY ENFORCE WHEN ACTUALLY _SENDING_ XRP
            serviceFeeDrops >= 5_000_000 && // Only enforce if 5 XRP or higher
            NetworkService.getNetwork().key === 'MAINNET' && // Only enforce on mainnet
            typeof onTxMaySend === 'function'
            // &&
            // typeof updateSendingAmountDrops === 'function'
        ) {
            // Only enforce for payments, offers, and AMM deposits
            // To prevent people from getting stuck with e.g. XRP withdrawing from AMM
            if (
                !txType || (
                    String(txType || '').match(/payment/i) ||
                    String(txType || '').match(/deposit/i) ||
                    String(txType || '').match(/create/i) ||
                    String(txType || '').match(/accept/i) ||
                    String(txType || '').match(/finish/i) ||
                    String(txType || '').match(/mint/i) ||
                    String(txType || '').match(/modify/i) ||
                    String(txType || '').match(/claim/i) ||
                    String(txType || '').match(/authorize/i) ||
                    String(txType || '').match(/batch/i)
                )
            ) {
                return true;
            }
        }
    
        return false;
    };

    updateSendingAmount = () => {
        const {
            updateSendingAmountDrops,
            spendableBalanceDrops,
            txFeeDrops,
            serviceFeeDrops,
        } = this.props;

        if (typeof updateSendingAmountDrops === 'function') {
            let sendingAmount = spendableBalanceDrops - txFeeDrops - serviceFeeDrops;
            if (sendingAmount < 0) {
                sendingAmount = 0;
            }
            updateSendingAmountDrops(sendingAmount);
            this.setState({
                didUpdate: true,
            });
        }
    };

    render() {
        // const { title, direction, checked, isDisabled, testID, style } = this.props;

        const {
            spendableBalanceDrops,
            serviceFeeDrops,
            txFeeDrops,
            sendAmountDrops,
            onTxMaySend,
            updateSendingAmountDrops,
            style,
        } = this.props;

        if (!this.enforceFeeAvailability()) {
            // console.log('no enforce')
            if (onTxMaySend) {
                // So force re-enable being allowed to send
                onTxMaySend(true);
            }
            return null;
        }
        
        if (this.canSendFee()) {
            // console.log('cansend')
            return null;
        }

        let maxSpendable = (
            spendableBalanceDrops -
            txFeeDrops -
            serviceFeeDrops
        ) / 1_000_000;

        maxSpendable = Math.max(0, maxSpendable);

        return (
            <View style={styles.container}>
                <View style={[
                    AppStyles.borderGreen,
                    // eslint-disable-next-line react-native/no-inline-styles
                    { display: 'none' },
                ]}>
                    <Text style={styles.title}>DEBUG Service Fee Spendable</Text>
                    <Spacer size={20} />
                    <Text style={styles.title}>spendableBalanceDrops</Text>
                    <Text style={styles.title}>{spendableBalanceDrops}</Text>
                    <Spacer size={20} />
                    <Text style={styles.title}>sendAmountDrops</Text>
                    <Text style={styles.title}>{sendAmountDrops}</Text>
                    <Spacer size={10} />
                    <Text style={styles.title}>serviceFeeDrops</Text>
                    <Text style={styles.title}>{serviceFeeDrops}</Text>
                    <Spacer size={10} />
                    <Text style={styles.title}>txFeeDrops</Text>
                    <Text style={styles.title}>{txFeeDrops}</Text>
                    <Spacer size={10} />
                    <Text style={styles.title}>this.canSendFee()</Text>
                    <Text style={styles.title}>{this.canSendFee() ? 'YES' : 'NO'}</Text>
                    <Spacer size={10} />
                    <Text style={styles.title}>this.postTxRemainingDrops() - XRP remaining/short</Text>
                    <Text style={styles.title}>{this.postTxRemainingDrops() / 1_000_000}</Text>
                    <Spacer size={10} />
                    <Text style={styles.title}>typeof onTxMaySend</Text>
                    <Text style={styles.title}>{typeof onTxMaySend}</Text>
                    <Spacer size={10} />
                    <Text style={styles.title}>typeof updateSendingAmountDrops</Text>
                    <Text style={styles.title}>{typeof updateSendingAmountDrops}</Text>
                </View>

                <TouchableDebounce
                    onPress={() => { 
                        const { touchedCount } = this.state;
                        if (typeof updateSendingAmountDrops !== 'function') {
                            // Allow to bypass by slow-tapping
                            this.setState({
                                touchedCount: touchedCount + 1,
                            });
                        }
                    }}
                    activeOpacity={1}
                    style={[
                        style,
                        styles.textContainer,
                    ]}
                >
                    <Icon name="IconInfo" size={30} style={[
                        styles.icon,
                    ]} />
                    {sendAmountDrops > 0 && (
                        // Sending XRP, so sending drops, so we can actually update the amount
                        <Text>
                            <Text style={[ AppStyles.baseText, AppStyles.colorPrimary, styles.textItem ]}>
                                {
                                    Localize.t('xamanServiceFee.updateToMaxSpendingAmount', { amount: '||||' })
                                        .split('||||')?.[0]
                                }
                            </Text>
                            <Text style={[
                                AppStyles.baseText, AppStyles.bold, AppStyles.colorPrimary, styles.textItem,
                            ]}>{' '}{Localize.formatNumber(maxSpendable)}{' '}{NetworkService.getNativeAsset()}{' '}
                            </Text>
                            <Text style={[ AppStyles.baseText, AppStyles.colorPrimary, styles.textItem ]}>
                                {
                                    Localize.t('xamanServiceFee.updateToMaxSpendingAmount', { amount: '||||' })
                                        .split('||||')?.[1]
                                }

                            </Text>
                        </Text>
                    )}
                    {!(sendAmountDrops > 0) && (
                        // Sending IOU, so we can't update the amount and we have to tell them to update
                        <Text>
                            <Text style={[ AppStyles.baseText, AppStyles.colorPrimary, styles.textItem ]}>
                                {
                                    Localize.t('xamanServiceFee.updateToSatisfyMissingAmount', { amount: '||||' })
                                        .split('||||')?.[0]
                                }
                            </Text>
                            <Text style={[
                                AppStyles.baseText, AppStyles.bold, AppStyles.colorPrimary, styles.textItem,
                            ]}>
                                {' '}{
                                    Localize.formatNumber(
                                        Math.abs(
                                            spendableBalanceDrops -
                                            txFeeDrops -
                                            serviceFeeDrops,
                                        ) / 1_000_000,
                                    )} { NetworkService.getNativeAsset() }{' '}
                            </Text>
                            <Text style={[ AppStyles.baseText, AppStyles.colorPrimary, styles.textItem ]}>
                                {
                                    Localize.t('xamanServiceFee.updateToSatisfyMissingAmount', { amount: '||||' })
                                        .split('||||')?.[1]
                                }
                            </Text>
                        </Text>
                    )}
                </TouchableDebounce>

                { typeof updateSendingAmountDrops === 'function' && sendAmountDrops > 0 && (
                    <Button
                        onPress={this.updateSendingAmount}
                        rounded
                        label={Localize.t('xamanServiceFee.updateBtn')}
                    />
                )}
            </View>
        );
    }
}

export default ServiceFeeSpendable;
