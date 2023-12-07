import React, { Component } from 'react';
import { View, Text } from 'react-native';

import Localize from '@locale';

import { Import } from '@common/libs/ledger/transactions';

import { Icon, ReadMore, TouchableDebounce } from '@components/General';
import { AccountElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
import { Clipboard } from '@common/helpers/clipboard';
import { Toast } from '@common/helpers/interface';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Import;
}

export interface State {}

/* Component ==================================================================== */
class ImportTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    copyBlob = () => {
        const { transaction } = this.props;

        Clipboard.setString(transaction.Blob);
        Toast(Localize.t('payload.blobCopiedToClipboard'));
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.Blob && (
                    <>
                        <View style={AppStyles.row}>
                            <Text style={styles.label}>{Localize.t('global.blob')}</Text>
                            <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                                <TouchableDebounce style={styles.copyButton} onPress={this.copyBlob}>
                                    <Text style={styles.copyText}>{Localize.t('global.copy')}</Text>
                                    <Icon size={18} name="IconClipboard" style={AppStyles.imgColorGrey} />
                                </TouchableDebounce>
                            </View>
                        </View>
                        <View style={styles.contentBox}>
                            <ReadMore numberOfLines={3} textStyle={styles.value}>
                                {transaction.Blob}
                            </ReadMore>
                        </View>
                    </>
                )}

                {transaction.Issuer && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.issuer')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Issuer}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}
            </>
        );
    }
}

export default ImportTemplate;
