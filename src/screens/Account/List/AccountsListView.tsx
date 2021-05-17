/**
 * Accounts List Screen
 */

import { find } from 'lodash';
import { Results } from 'realm';

import React, { Component } from 'react';
import { View, Text, Image, ImageBackground, ScrollView } from 'react-native';

import { Navigation } from 'react-native-navigation';

// helpers
import { VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

// store
import { AccessLevels } from '@store/types';
import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import StyleService from '@services/StyleService';

// components
import { Button, Icon, Header, DragSortableView } from '@components/General';

import Localize from '@locale';
// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Results<AccountSchema>;
    dataSource: any;
    signableAccount: Array<AccountSchema>;
    scrollEnabled: boolean;
    reorderEnabled: boolean;
}

/* Component ==================================================================== */
class AccountListView extends Component<Props, State> {
    static screenName = AppScreens.Account.List;

    private navigationListener: any;

    static options() {
        return {
            topBar: { visible: false },
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const accounts = AccountRepository.getAccounts().sorted([['order', false]]);

        this.state = {
            accounts,
            dataSource: [...accounts],
            signableAccount: AccountRepository.getSignableAccounts(),
            scrollEnabled: true,
            reorderEnabled: false,
        };
    }

    componentDidMount() {
        this.navigationListener = Navigation.events().bindComponent(this);
    }

    componentWillUnmount() {
        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    componentDidAppear() {
        const accounts = AccountRepository.getAccounts().sorted([['order', false]]);

        this.setState({
            accounts,
            dataSource: [...accounts],
            signableAccount: AccountRepository.getSignableAccounts(),
        });
    }

    onItemPress = (account: AccountSchema) => {
        const { reorderEnabled } = this.state;

        if (!reorderEnabled) {
            Navigator.push(AppScreens.Account.Edit.Settings, {}, { account });
        }
    };

    isRegularKey = (account: AccountSchema) => {
        const { accounts } = this.state;

        const found = find(accounts, { regularKey: account.address });

        if (found) {
            return found.label;
        }

        return false;
    };

    onAccountReorder = (data: Array<AccountSchema>) => {
        this.setState({
            dataSource: data,
        });
        for (let i = 0; i < data.length; i++) {
            if (data[i].address) {
                AccountRepository.update({
                    address: data[i].address,
                    order: i,
                });
            }
        }
    };

    toggleReorder = () => {
        const { reorderEnabled } = this.state;

        this.setState({
            reorderEnabled: !reorderEnabled,
        });
    };

    onItemDragStart = () => {
        this.setState({
            scrollEnabled: false,
        });
        VibrateHapticFeedback('impactLight');
    };

    onItemDragEnd = () => {
        this.setState({
            scrollEnabled: true,
        });
        VibrateHapticFeedback('impactLight');
    };

    renderItem = (item: AccountSchema) => {
        const { signableAccount, reorderEnabled } = this.state;

        if (!item?.isValid()) return null;

        // default full access
        let accessLevelLabel = Localize.t('account.fullAccess');
        let accessLevelIcon = 'IconCornerLeftUp' as Extract<keyof typeof Images, string>;

        const signable = find(signableAccount, { address: item.address });

        if (!signable) {
            accessLevelLabel = Localize.t('account.readOnly');
            accessLevelIcon = 'IconLock';
        }

        // promoted by regular key
        if (item.accessLevel === AccessLevels.Readonly && signable) {
            accessLevelIcon = 'IconKey';
        }

        const regularKeyFor = this.isRegularKey(item);

        if (regularKeyFor) {
            accessLevelLabel = `${Localize.t('account.regularKeyFor')} ${regularKeyFor}`;
            accessLevelIcon = 'IconKey';
        }

        return (
            <View style={[styles.rowContainer]}>
                <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                    <View style={[AppStyles.flex6]}>
                        <View style={[AppStyles.flex1]}>
                            <Text style={[styles.accountLabel]}>{item.label}</Text>
                            <View style={[styles.accessLevelContainer]}>
                                <Icon size={13} name={accessLevelIcon} style={AppStyles.imgColorGrey} />
                                <Text style={[styles.accessLevelLabel]}>{accessLevelLabel}</Text>
                                {item.hidden && (
                                    <>
                                        <Text style={[styles.accessLevelLabel]}> </Text>
                                        <Icon size={13} name="IconEyeOff" style={AppStyles.imgColorGrey} />
                                        <Text style={[styles.accessLevelLabel]}>{Localize.t('global.hidden')}</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                    <View style={[AppStyles.flex2]}>
                        {reorderEnabled ? (
                            <View style={AppStyles.rightAligned}>
                                <Icon size={20} name="IconReorderHandle" style={AppStyles.imgColorGrey} />
                            </View>
                        ) : (
                            <Button
                                light
                                roundedSmall
                                icon="IconEdit"
                                iconStyle={[styles.rowIcon]}
                                iconSize={15}
                                textStyle={styles.buttonEditText}
                                label={Localize.t('global.edit')}
                                onPress={() => {
                                    this.onItemPress(item);
                                }}
                            />
                        )}
                    </View>
                </View>
                <View style={[AppStyles.row, styles.subRow]}>
                    <View style={[AppStyles.flex1]}>
                        <Text style={[AppStyles.monoBold, AppStyles.colorGrey, styles.subLabel]}>
                            {Localize.t('global.address')}:
                        </Text>
                        <Text style={[AppStyles.monoSubText, AppStyles.colorBlue]}>{item.address}</Text>
                    </View>
                </View>
            </View>
        );
    };

    render() {
        const { accounts, dataSource, scrollEnabled, reorderEnabled } = this.state;

        return (
            <View testID="accounts-list-screen" style={[AppStyles.container]}>
                <Header
                    centerComponent={{ text: Localize.t('global.accounts') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        testID: 'back-button',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    rightComponent={
                        accounts.isEmpty()
                            ? {
                                  icon: 'IconPlus',
                                  testID: 'add-account-button',
                                  onPress: () => {
                                      Navigator.push(AppScreens.Account.Add);
                                  },
                              }
                            : {
                                  icon: reorderEnabled ? 'IconCheck' : 'IconReorder',
                                  iconSize: reorderEnabled ? 26 : 30,
                                  testID: 'reorder-toggle-button',
                                  onPress: this.toggleReorder,
                              }
                    }
                />

                {accounts.isEmpty() ? (
                    <ImageBackground
                        source={StyleService.getImage('BackgroundShapes')}
                        imageStyle={AppStyles.BackgroundShapes}
                        style={[AppStyles.contentContainer, AppStyles.padding]}
                    >
                        <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageFirstAccount')} />
                        <Text style={[AppStyles.emptyText]}>{Localize.t('home.emptyAccountAddFirstAccount')}</Text>
                        <Button
                            label={Localize.t('home.addAccount')}
                            icon="IconPlus"
                            iconStyle={[AppStyles.imgColorWhite]}
                            rounded
                            onPress={() => {
                                Navigator.push(AppScreens.Account.Add);
                            }}
                        />
                    </ImageBackground>
                ) : (
                    <ScrollView
                        testID="account-list-scroll"
                        scrollEnabled={scrollEnabled}
                        style={[AppStyles.flex1]}
                        contentContainerStyle={[AppStyles.paddingBottom]}
                        horizontal={false}
                        directionalLockEnabled
                    >
                        <View style={[styles.rowAddContainer]}>
                            {reorderEnabled ? (
                                <View style={[AppStyles.paddingHorizontalSml]}>
                                    <Text
                                        adjustsFontSizeToFit
                                        numberOfLines={2}
                                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}
                                    >
                                        {Localize.t('account.tapAndHoldToReorder')}
                                    </Text>
                                </View>
                            ) : (
                                <Button
                                    testID="add-account-button"
                                    label={Localize.t('home.addAccount')}
                                    icon="IconPlus"
                                    roundedSmall
                                    secondary
                                    onPress={() => {
                                        Navigator.push(AppScreens.Account.Add);
                                    }}
                                />
                            )}
                        </View>

                        <DragSortableView
                            parentWidth={AppSizes.screen.width}
                            childrenWidth={AppSizes.screen.width}
                            childrenHeight={styles.rowContainer.height}
                            dataSource={dataSource}
                            marginChildrenTop={10}
                            keyExtractor={(item, index) => `${item.address}${index}` || String(index)}
                            testIDExtractor={(item) => `account-${item.address}`}
                            renderItem={this.renderItem}
                            onDragStart={this.onItemDragStart}
                            onDragEnd={this.onItemDragEnd}
                            onDataChange={this.onAccountReorder}
                            onClickItem={this.onItemPress}
                            sortable={reorderEnabled}
                        />
                    </ScrollView>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountListView;
