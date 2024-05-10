import React, { PureComponent } from 'react';
import { InteractionManager, Text, View } from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { XAppOrigin } from '@common/libs/payload';

import { InstanceTypes } from '@common/libs/ledger/types/enums';
import { BaseTransaction } from '@common/libs/ledger/transactions/common';

import { ComponentTypes } from '@services/NavigationService';

import { Button, Icon, ReadMore, TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { Props as XAppBrowserModalProps } from '@screens/Modal/XAppBrowser/types';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

interface State {
    visibleMemo: boolean;
    xAppIdentifier?: string;
    ownUpdate: boolean;
}

/* Component ==================================================================== */
class Memos extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            ownUpdate: false,
            visibleMemo: true,
            xAppIdentifier: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.checkXAppIdentifier);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> | null {
        if (prevState.ownUpdate) {
            return {
                ownUpdate: false,
            };
        }

        if (nextProps.advisory && nextProps.advisory !== 'UNKNOWN') {
            return {
                visibleMemo: false,
            };
        }

        return null;
    }

    checkXAppIdentifier = () => {
        const { item } = this.props;

        if (
            item.InstanceType !== InstanceTypes.FallbackTransaction &&
            item.InstanceType !== InstanceTypes.GenuineTransaction
        ) {
            return;
        }

        const identifier = item.getXappIdentifier();

        if (identifier) {
            this.setState({
                xAppIdentifier: identifier,
            });
        }
    };

    onOpenXAppPress = () => {
        const { item } = this.props;
        const { xAppIdentifier } = this.state;

        Navigator.showModal<XAppBrowserModalProps>(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: xAppIdentifier!,
                origin: XAppOrigin.TRANSACTION_MEMO,
                originData: { txid: (item as any).hash },
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
    };

    renderOpenXAppButton = () => {
        const { advisory, componentType } = this.props;
        const { xAppIdentifier } = this.state;

        // possible danger, do not show open xApp button
        // presented as modal, also hide the button
        if ((advisory && advisory !== 'UNKNOWN') || !xAppIdentifier || componentType === ComponentTypes.Modal) {
            return null;
        }

        return (
            <View style={styles.itemContainer}>
                <Button rounded label={Localize.t('global.openXApp')} secondary onPress={this.onOpenXAppPress} />
            </View>
        );
    };

    onShowMemoPress = () => {
        this.setState({
            visibleMemo: true,
            ownUpdate: true,
        });
    };

    renderMemos = () => {
        const { item, advisory } = this.props;
        const { visibleMemo } = this.state;

        // we are hiding the memo because of advisory report
        if (!visibleMemo) {
            return (
                <TouchableDebounce onPress={this.onShowMemoPress}>
                    <Text style={[styles.detailsValueText, AppStyles.colorRed]}>{Localize.t('events.showMemo')}</Text>
                </TouchableDebounce>
            );
        }

        return (
            <ReadMore
                numberOfLines={2}
                textStyle={[
                    styles.memoText,
                    AppStyles.textCenterAligned,
                    advisory && advisory !== 'UNKNOWN' ? AppStyles.colorRed : {},
                ]}
            >
                {(item as BaseTransaction).Memos!.map((m) => {
                    if (m.MemoType === 'text/plain' || !m.MemoType) {
                        return m.MemoData;
                    }
                    return `${m.MemoType}: ${m.MemoData}`;
                })}
            </ReadMore>
        );
    };

    render() {
        const { item } = this.props;
        const { xAppIdentifier } = this.state;

        // no memo to render
        if (
            (item.InstanceType !== InstanceTypes.FallbackTransaction &&
                item.InstanceType !== InstanceTypes.GenuineTransaction) ||
            !item.Memos
        ) {
            return null;
        }

        // there is an xApp identifier in one of the memos
        if (xAppIdentifier) {
            return this.renderOpenXAppButton();
        }

        return (
            <View style={styles.itemContainer}>
                <View style={AppStyles.row}>
                    <Icon name="IconFileText" size={18} style={AppStyles.imgColorPrimary} />
                    <Text style={styles.detailsLabelText}> {Localize.t('global.memo')}</Text>
                </View>
                {this.renderMemos()}
            </View>
        );
    }
}

export default Memos;
