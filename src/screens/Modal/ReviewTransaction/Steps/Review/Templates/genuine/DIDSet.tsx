import { isUndefined } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Clipboard } from '@common/helpers/clipboard';
import { Toast } from '@common/helpers/interface';

import { DIDSet } from '@common/libs/ledger/transactions';

import { Icon, ReadMore, TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: DIDSet;
}

export interface State {}

/* Component ==================================================================== */
class DIDSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    copyDIDDocumentField = () => {
        const { transaction } = this.props;
        Clipboard.setString(transaction.DIDDocument);
        Toast(Localize.t('payload.didDocumentCopiedToClipboard'));
    };

    copyDataField = () => {
        const { transaction } = this.props;
        Clipboard.setString(transaction.Data);
        Toast(Localize.t('payload.dataCopiedToClipboard'));
    };

    copyURIField = () => {
        const { transaction } = this.props;
        Clipboard.setString(transaction.Data);
        Toast(Localize.t('payload.uriCopiedToClipboard'));
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.URI) && (
                    <>
                        <View style={AppStyles.row}>
                            <Text style={styles.label}>{Localize.t('global.uri')}</Text>
                            <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                                {!!transaction.URI && (
                                    <TouchableDebounce style={styles.copyButton} onPress={this.copyURIField}>
                                        <Text style={styles.copyText}>{Localize.t('global.copy')}</Text>
                                        <Icon size={18} name="IconClipboard" style={AppStyles.imgColorGrey} />
                                    </TouchableDebounce>
                                )}
                            </View>
                        </View>
                        <View style={styles.contentBox}>
                            <ReadMore numberOfLines={3} textStyle={styles.value}>
                                {transaction.URI || Localize.t('global.empty')}
                            </ReadMore>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.DIDDocument) && (
                    <>
                        <View style={AppStyles.row}>
                            <Text style={styles.label}>{Localize.t('global.didDocument')}</Text>
                            {!!transaction.DIDDocument && (
                                <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                                    <TouchableDebounce style={styles.copyButton} onPress={this.copyDIDDocumentField}>
                                        <Text style={styles.copyText}>{Localize.t('global.copy')}</Text>
                                        <Icon size={18} name="IconClipboard" style={AppStyles.imgColorGrey} />
                                    </TouchableDebounce>
                                </View>
                            )}
                        </View>
                        <View style={styles.contentBox}>
                            <ReadMore numberOfLines={3} textStyle={styles.value}>
                                {transaction.DIDDocument || Localize.t('global.empty')}
                            </ReadMore>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Data) && (
                    <>
                        <View style={AppStyles.row}>
                            <Text style={styles.label}>{Localize.t('global.data')}</Text>
                            {!!transaction.Data && (
                                <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                                    <TouchableDebounce style={styles.copyButton} onPress={this.copyDataField}>
                                        <Text style={styles.copyText}>{Localize.t('global.copy')}</Text>
                                        <Icon size={18} name="IconClipboard" style={AppStyles.imgColorGrey} />
                                    </TouchableDebounce>
                                </View>
                            )}
                        </View>
                        <View style={styles.contentBox}>
                            <ReadMore numberOfLines={3} textStyle={styles.value}>
                                {transaction.Data || Localize.t('global.empty')}
                            </ReadMore>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default DIDSetTemplate;
