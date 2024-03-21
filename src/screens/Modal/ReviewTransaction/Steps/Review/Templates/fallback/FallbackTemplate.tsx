import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { FallbackTransaction } from '@common/libs/ledger/transactions';

import { Clipboard } from '@common/helpers/clipboard';
import { Toast } from '@common/helpers/interface';

import { Button, JsonTree } from '@components/General';

import Localize from '@locale';

import { AppFonts, AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
import { FeePicker } from '@components/Modules';
import NetworkService from '@services/NetworkService';
import { AmountParser } from '@common/libs/ledger/parser/common';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: FallbackTransaction;
}

export interface State {
    transactionJsonData?: Record<string, any>;
    showFeePicker: boolean;
}
/* Component ==================================================================== */
class FallbackTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            transactionJsonData: undefined,
            showFeePicker: typeof props.transaction?.Fee === 'undefined' && !props.payload.isMultiSign(),
        };
    }

    static getJsonData(transaction: FallbackTransaction) {
        // remove `Account` from the json as we are showing it in more proper way
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Account, ...jsonData } = transaction.JsonForSigning;

        return jsonData;
    }

    static getDerivedStateFromProps(nextProps: Props): Partial<State> | null {
        if (nextProps.transaction) {
            return {
                transactionJsonData: FallbackTemplate.getJsonData(nextProps.transaction),
            };
        }

        return null;
    }

    onJsonCopyPress = () => {
        const { transactionJsonData } = this.state;

        Clipboard.setString(JSON.stringify(transactionJsonData, null, 2));

        Toast(Localize.t('payload.transactionJsonCopiedToClipboard'));
    };

    setTransactionFee = (fee: any) => {
        const { transaction } = this.props;

        // NOTE: setting the transaction fee require Native and not Drops
        transaction.Fee = {
            currency: NetworkService.getNativeAsset(),
            value: new AmountParser(fee.value).dropsToNative().toString(),
        };

        this.setState({
            transactionJsonData: FallbackTemplate.getJsonData(transaction),
        });
    };

    render() {
        const { transactionJsonData, showFeePicker } = this.state;

        if (!transactionJsonData) {
            return null;
        }

        return (
            <>
                <View style={[AppStyles.row, styles.label]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                            {Localize.t('global.jsonView')}
                        </Text>
                    </View>
                    <Button
                        onPress={this.onJsonCopyPress}
                        icon="IconClipboard"
                        label={Localize.t('global.copy')}
                        textStyle={{ fontSize: AppFonts.small.size }}
                        iconSize={15}
                        roundedMini
                        light
                    />
                </View>

                {/* Transaction JSON */}
                <View style={styles.jsonTreeContainer}>
                    <JsonTree data={transactionJsonData} />
                </View>

                {/* Fee picker  */}
                {showFeePicker && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                        <FeePicker
                            txJson={transactionJsonData}
                            onSelect={this.setTransactionFee}
                            containerStyle={styles.contentBox}
                            textStyle={styles.feeText}
                        />
                    </>
                )}
            </>
        );
    }
}

export default FallbackTemplate;
