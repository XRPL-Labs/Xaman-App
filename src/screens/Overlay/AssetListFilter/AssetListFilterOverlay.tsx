/**
 * Add Currency Screen
 */

// import { countBy, filter, forEach, sortBy } from 'lodash';
import React, { Component } from 'react';
import {
    // InteractionManager,
    // KeyboardEvent,
    // InteractionManager,
    // ScrollView,
    // Text,
    View,
} from 'react-native';

import Keyboard from '@common/helpers/keyboard';

import { Navigator } from '@common/helpers/navigator';
// import { Toast } from '@common/helpers/interface';
import { AppScreens } from '@common/constants';

// import { AccountRepository } from '@store/repositories';
// import { AccountModel, TrustLineModel } from '@store/models';

// import NetworkService from '@services/NetworkService';
// import LedgerService from '@services/LedgerService';

// import { CalculateAvailableBalance } from '@common/utils/balance';
// import { DecodeAccountId } from '@common/utils/codec';

// import { LedgerEntry } from '@common/libs/ledger/types/ledger';
// import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

// components
import { ActionPanel } from '@components/General';

// import { TokenAvatar, TokenIcon } from '@components/Modules/TokenElement';

// import Localize from '@locale';

// style
import { AppSizes, AppStyles } from '@theme';
// import styles from './styles';
import { FiltersType, ListFilter } from '@components/Modules/AssetsList/Tokens/ListFilter';

/* types ==================================================================== */
export interface Props {
    // account: AccountModel;
    filters?: FiltersType;
    visible: boolean;
    onFilterChange: (filters: FiltersType | undefined) => void;
    onReorderPress: () => void;
    onTokenAddPress: () => void;
    onReorderSavePress: () => void;
    hideTopElements: (toggle: boolean) => void;
    onAddTokenPress: () => void;
}

export interface State {
    // isLoading: boolean;
    // accountObjects: any;
    // nfTokenPageCount: number;
    // networkReserve: { BaseReserve: number; OwnerReserve: number };
    // isSignable: boolean;
    actionPanelExtraHeight: number;
}

/* Component ==================================================================== */
class AssetListFilterOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.AssetListFilter;

    private actionPanelRef: React.RefObject<ActionPanel>;

    private setListenerTimeout?: ReturnType<typeof setTimeout>;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            actionPanelExtraHeight: 0,
        //     // isLoading: true,
        //     // accountObjects: [],
        //     // nfTokenPageCount: 0,
        //     // networkReserve: NetworkService.getNetworkReserve(),
        //     // isSignable: true,
        };

        this.actionPanelRef = React.createRef();
    }

    componentDidMount() {
        const { hideTopElements } = this.props;

        // check if account is signable
        // const isSignable = AccountRepository.isSignable(account);
        // this.setState({
        //     isSignable,
        // });
        hideTopElements(true);

        this.setListenerTimeout = setTimeout(() => {
            Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
        }, 500);
    }

    componentWillUnmount() {
        const { hideTopElements } = this.props;
        hideTopElements(false);
        if (this.setListenerTimeout) clearTimeout(this.setListenerTimeout);

        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    onClosePress = () => {
        this.actionPanelRef?.current?.slideDown();
        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    };

    onKeyboardShow = () => {
        setTimeout(() => {
            if (this.actionPanelRef?.current) {
                this.actionPanelRef?.current.snapTo(2);
            }
        }, 10);
    };

    onKeyboardHide = () => {
        if (this.actionPanelRef?.current) {
            this.actionPanelRef?.current.snapTo(1);
        }
    };

    render() {
        const {
            filters,
            onFilterChange,
            onReorderPress,
            onAddTokenPress,
        } = this.props;
        const { actionPanelExtraHeight } = this.state;
        // const { isLoading, isSignable } = this.state;

        return (
            <ActionPanel
                /** TODO: height based on keyboard size */
                height={400 + AppSizes.safeAreaBottomInset + actionPanelExtraHeight}
                ref={this.actionPanelRef}
                onSlideDown={Navigator.dismissOverlay}
            >
                <View style={[AppStyles.column, AppStyles.centerAligned]}>
                    <ListFilter
                        filters={filters}
                        visible
                        onAddTokenPress={() => {
                            this.onClosePress();
                            onAddTokenPress();
                        }}
                        onFilterChange={(...args) => {
                            onFilterChange(...args);
                        }}
                        onReorderPress={() => {
                            this.onClosePress();
                            onReorderPress();
                        }}
                    />
                </View>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default AssetListFilterOverlay;
