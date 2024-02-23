/**
 * Destination Picker modal
 */

import { isEmpty, flatMap, get, uniqBy, toNumber } from 'lodash';
import Realm from 'realm';

import React, { Component } from 'react';
import { View, Text, SectionList, BackHandler, NativeEventSubscription } from 'react-native';
import { StringType, XrplDestination } from 'xumm-string-decode';

import { AccountRepository, ContactRepository } from '@store/repositories';
import { ContactModel, AccountModel } from '@store/models';

import { AppScreens } from '@common/constants';
import { Destination } from '@common/libs/ledger/parser/types';
import { getAccountName, getAccountInfo, AccountInfoType } from '@common/helpers/resolver';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { NormalizeDestination } from '@common/utils/codec';

import { BackendService } from '@services';

// components
import { Button, TextInput, Footer, InfoMessage, LoadingIndicator } from '@components/General';
import { AccountElement } from '@components/Modules';

// locale
import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onClose: () => void;
    onSelect: (destination: Destination, info: AccountInfoType) => void;

    ignoreDestinationTag: boolean;
}

export interface State {
    isSearching: boolean;
    isLoading: boolean;
    searchText: string;
    accounts: Realm.Results<AccountModel>;
    contacts: Realm.Results<ContactModel>;
    dataSource: any[];
    destination?: Destination;
    destinationInfo?: AccountInfoType;
}
/* Component ==================================================================== */
class DestinationPicker extends Component<Props, State> {
    static screenName = AppScreens.Modal.DestinationPicker;

    private lookupTimeout: any;
    private sequence: number;
    private backHandler: NativeEventSubscription | undefined;

    constructor(props: Props) {
        super(props);

        this.state = {
            isSearching: false,
            isLoading: false,
            searchText: '',
            accounts: AccountRepository.getAccounts().sorted([['order', false]]),
            contacts: ContactRepository.getContacts(),
            dataSource: [],
            destination: undefined,
            destinationInfo: undefined,
        };

        this.lookupTimeout = null;
        this.sequence = 0;
    }

    componentDidMount() {
        this.setDefaultDataSource();

        // prevent from hardware back in android devices
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }

        if (this.lookupTimeout) clearTimeout(this.lookupTimeout);
    }

    doAccountLookUp = async (result: XrplDestination) => {
        this.setState({
            searchText: result.to,
            isSearching: true,
        });

        const { to, tag } = NormalizeDestination(result);

        if (to) {
            const accountInfo = await getAccountName(to, tag);

            this.setState({
                dataSource: this.getSearchResultSource([
                    {
                        name: accountInfo.name || '',
                        address: to,
                        tag,
                        source: accountInfo.source,
                        kycApproved: accountInfo.kycApproved,
                    },
                ]),
                isSearching: false,
            });

            // select as destination
            this.setState({
                destination: { name: accountInfo.name || '', address: to, tag: toNumber(tag) || undefined },
            });
        } else {
            this.doLookUp(result.to);
        }
    };

    setSearchResult = (searchResult: any) => {
        const { destination } = this.state;

        // if search result only have one result select it
        if (searchResult && searchResult.length === 1) {
            const onlyResult = searchResult[0];
            // select as destination
            if (!destination || (onlyResult.address !== destination.address && onlyResult.tag !== destination.tag)) {
                this.setState({
                    destination: {
                        name: onlyResult.name || '',
                        address: onlyResult.address,
                        tag: toNumber(onlyResult.tag) || undefined,
                    },
                });
            }
        } else if (destination) {
            this.setState({
                destination: undefined,
            });
        }

        this.setState({
            dataSource: this.getSearchResultSource(searchResult),
            isSearching: false,
        });
    };

    doLookUp = (searchText: string) => {
        const { contacts, accounts } = this.state;

        clearTimeout(this.lookupTimeout);

        this.lookupTimeout = setTimeout(() => {
            // set searching true
            this.setState({
                isSearching: true,
            });

            // increase sequence
            this.sequence += 1;
            // get a copy of sequence
            const { sequence } = this;

            // create empty search result array
            const searchResult = [] as any;

            // search for contacts
            contacts.forEach((item) => {
                if (
                    item.name?.toLowerCase().indexOf(searchText?.toLowerCase()) !== -1 ||
                    item.address?.toLowerCase().indexOf(searchText?.toLowerCase()) !== -1
                ) {
                    searchResult.push({
                        name: item.name,
                        address: item.address,
                        tag: item.destinationTag,
                        source: 'contacts',
                    });
                }
            });

            // search for accounts
            accounts.forEach((item) => {
                if (
                    item.label?.toLowerCase().indexOf(searchText?.toLowerCase()) !== -1 ||
                    item.address?.toLowerCase().indexOf(searchText?.toLowerCase()) !== -1
                ) {
                    searchResult.push({
                        name: item.label,
                        address: item.address,
                        source: 'accounts',
                    });
                }
            });

            // if text length is more than 4 do server lookup
            if (searchText?.length >= 4) {
                BackendService.lookup(searchText)
                    .then((res: any) => {
                        if (!isEmpty(res) && res.error !== true) {
                            if (!isEmpty(res.matches)) {
                                res.matches.forEach(async (element: any) => {
                                    // if payid in result, then look for payId in local source as well
                                    if (element.source === 'payid') {
                                        const internalResult = await getAccountName(element.account, element.tag, true);

                                        // found in local source
                                        if (internalResult.name) {
                                            searchResult.push({
                                                name: internalResult.name || '',
                                                address: element.account,
                                                tag: element.tag,
                                                source: internalResult.source,
                                            });

                                            return;
                                        }
                                    }

                                    searchResult.push({
                                        name: element.alias === element.account ? '' : element.alias,
                                        address: element.account,
                                        source: element.source,
                                        tag: element.tag,
                                        kycApproved: element.kycApproved,
                                    });
                                });
                            }
                        }
                    })
                    .catch(() => {})
                    .finally(() => {
                        // this will make sure the latest call will apply
                        if (sequence === this.sequence) {
                            this.setSearchResult(searchResult);
                        }
                    });
            } else if (sequence === this.sequence) {
                // this will make sure the latest call will apply
                this.setSearchResult(searchResult);
            }
        }, 500);
    };

    onSearch = (searchText: string) => {
        this.setState({
            searchText,
        });

        if (searchText && searchText.length > 0) {
            // check if it's a xrp address
            // eslint-disable-next-line prefer-regex-literals
            const possibleAccountAddress = new RegExp(
                /[rX][rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{23,50}/,
            );

            if (possibleAccountAddress.test(searchText)) {
                this.doAccountLookUp({ to: searchText });
            } else {
                this.doLookUp(searchText);
            }
        } else {
            clearTimeout(this.lookupTimeout);

            this.setState(
                {
                    destination: undefined,
                },
                this.setDefaultDataSource,
            );
        }
    };

    getSearchResultSource = (searchResult: any) => {
        const dataSource = [];

        if (searchResult && searchResult.length > 0) {
            dataSource.push({
                title: Localize.t('send.searchResults'),
                data: uniqBy(searchResult, 'address'),
            });
        }

        return dataSource;
    };

    setDefaultDataSource = () => {
        const { contacts, accounts } = this.state;

        const dataSource = [];

        if (accounts && accounts.length !== 0) {
            dataSource.push({
                title: Localize.t('account.myAccounts'),
                data: flatMap(accounts, (a) => {
                    return { name: a.label, address: a.address };
                }),
            });
        }

        if (contacts && contacts.length === 0) {
            dataSource.push({
                title: Localize.t('global.contacts'),
                data: [{ empty: true, title: Localize.t('send.noContact') }],
            });
        } else {
            dataSource.push({
                title: Localize.t('global.contacts'),
                data: flatMap(contacts, (a) => {
                    return {
                        name: a.name,
                        address: a.address,
                        tag: a.destinationTag,
                    };
                }),
            });
        }

        this.setState({
            dataSource,
        });
    };

    onSelect = () => {
        const { destination, destinationInfo } = this.state;
        const { onSelect } = this.props;

        if (typeof onSelect === 'function') {
            onSelect(destination!, destinationInfo!);
        }

        Navigator.dismissModal();
    };

    onClose = () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        Navigator.dismissModal();
    };

    showEnterDestinationTag = () => {
        const { destination } = this.state;

        Navigator.showOverlay(AppScreens.Overlay.EnterDestinationTag, {
            buttonType: 'next',
            destination,
            onFinish: (destinationTag: string) => {
                Object.assign(destination!, { tag: destinationTag });
                this.setState(
                    {
                        destination,
                    },
                    this.onSelect,
                );
            },
            onScannerRead: ({ tag }: { tag: number }) => {
                Object.assign(destination!, { tag: String(tag) });
                this.setState(
                    {
                        destination,
                    },
                    this.showEnterDestinationTag,
                );
            },
            onScannerClose: this.showEnterDestinationTag,
        });
    };

    clearRecipient = () => {
        this.setState({
            searchText: '',
            destination: undefined,
        });
    };

    checkAndNext = async () => {
        const { ignoreDestinationTag } = this.props;
        const { destination } = this.state;

        this.setState({
            isLoading: true,
        });

        if (!destination) {
            // ignore
            return;
        }

        try {
            // check for account exist and potential destination tag required
            const destinationInfo = await getAccountInfo(destination.address);

            // set destination account info
            this.setState({
                destinationInfo,
            });

            // check for account risk and scam
            if (destinationInfo.risk === 'PROBABLE' || destinationInfo.risk === 'HIGH_PROBABILITY') {
                Navigator.showAlertModal({
                    type: 'warning',
                    text: Localize.t('send.destinationIsProbableIsScam'),
                    buttons: [
                        {
                            text: Localize.t('global.back'),
                            onPress: this.clearRecipient,
                            type: 'dismiss',
                            light: false,
                        },
                        {
                            text: Localize.t('global.continue'),
                            onPress: this.onSelect,
                            type: 'continue',
                            light: true,
                        },
                    ],
                });

                // don't move to next step
                return;
            }

            if (destinationInfo.risk === 'CONFIRMED') {
                Navigator.showOverlay(AppScreens.Overlay.FlaggedDestination, {
                    destination: destination.address,
                    onContinue: this.onSelect,
                    onDismissed: this.resetResult,
                });

                // don't move to next step
                return;
            }

            // check for destination tag require
            if (
                destinationInfo.requireDestinationTag &&
                (!destination.tag || Number(destination.tag) === 0) &&
                !ignoreDestinationTag
            ) {
                this.showEnterDestinationTag();

                // don't move to next step
                return;
            }
        } catch {
            Toast(Localize.t('send.unableGetRecipientAccountInfoPleaseTryAgain'));
            return;
        } finally {
            this.setState({ isLoading: false });
        }

        // go to the next step if everything was fine
        this.onSelect();
    };

    onScannerRead = (content: any) => {
        if (content.payId) {
            this.doAccountLookUp({ to: content.payId });
        } else {
            this.doAccountLookUp(content);
        }
    };

    resetResult = () => {
        this.setState(
            {
                searchText: '',
                destination: undefined,
            },
            this.setDefaultDataSource,
        );
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        const { dataSource } = this.state;

        if (title === Localize.t('send.searchResults')) {
            return (
                <View style={[styles.sectionHeader, AppStyles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Text style={[AppStyles.p, AppStyles.bold]}>
                            {title} {dataSource[0].data?.length > 0 && `(${dataSource[0].data?.length})`}
                        </Text>
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <Button
                            onPress={this.resetResult}
                            style={styles.clearSearchButton}
                            light
                            label={Localize.t('global.clearSearch')}
                        />
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.sectionHeader}>
                <Text style={[AppStyles.p, AppStyles.bold]}>{title}</Text>
            </View>
        );
    };

    renderItem = (row: any) => {
        const { destination } = this.state;

        const { item } = row;

        if (item.empty) {
            return <InfoMessage type="warning" label={item.title} />;
        }

        const selected = item.address === get(destination, 'address') && item.name === get(destination, 'name');

        return (
            <AccountElement
                address={item.address}
                tag={item.tag}
                info={{
                    address: item.address,
                    tag: item.tag,
                    name: item.name,
                    source: item.source,
                }}
                containerStyle={selected ? styles.accountElementSelected : {}}
                textStyle={selected ? styles.accountElementSelectedText : {}}
                visibleElements={{
                    tag: false,
                    avatar: true,
                    source: true,
                    menu: false,
                }}
                onPress={() => {
                    if (!selected) {
                        this.setState({
                            destination: item,
                        });
                    } else {
                        this.setState({
                            destination: undefined,
                        });
                    }
                }}
            />
        );
    };

    renderListEmptyComponent = () => {
        return (
            <>
                <View style={[styles.sectionHeader, AppStyles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('send.searchResults')}</Text>
                    </View>
                    <View style={AppStyles.flex1}>
                        <Button
                            onPress={this.resetResult}
                            style={styles.clearSearchButton}
                            light
                            roundedSmall
                            label={Localize.t('global.clearSearch')}
                        />
                    </View>
                </View>
                <View style={AppStyles.paddingVerticalSml}>
                    <InfoMessage type="warning" label={Localize.t('send.noSearchResult')} />
                </View>
            </>
        );
    };

    render() {
        const { destination, searchText, isSearching, isLoading, dataSource } = this.state;

        if (!dataSource) return null;

        return (
            <View testID="destination-picker-modal" style={AppStyles.container}>
                <View style={[AppStyles.centerAligned, { paddingVertical: AppSizes.padding }]}>
                    <Text style={AppStyles.h5}>{Localize.t('global.destination')}</Text>
                </View>

                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal]}>
                    <View style={AppStyles.row}>
                        <TextInput
                            placeholder={Localize.t('send.enterANameOrAddress')}
                            inputStyle={styles.inputText}
                            containerStyle={styles.inputContainer}
                            onChangeText={this.onSearch}
                            value={searchText}
                            scannerType={StringType.XrplDestination}
                            onScannerRead={this.onScannerRead}
                            showScanner
                        />
                    </View>

                    <View style={[AppStyles.flex8, AppStyles.paddingTopSml]}>
                        {isSearching ? (
                            <LoadingIndicator />
                        ) : (
                            <SectionList
                                ListEmptyComponent={this.renderListEmptyComponent}
                                extraData={searchText}
                                sections={dataSource}
                                renderItem={this.renderItem}
                                renderSectionHeader={this.renderSectionHeader}
                                keyExtractor={(item) => `${item.address}${item.tag}`}
                            />
                        )}
                    </View>
                </View>

                {/* Bottom Bar */}
                <Footer style={AppStyles.row} safeArea>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button light label={Localize.t('global.close')} onPress={this.onClose} />
                    </View>
                    <View style={AppStyles.flex2}>
                        <Button
                            isLoading={isLoading}
                            textStyle={AppStyles.strong}
                            isDisabled={!destination}
                            label={Localize.t('global.next')}
                            onPress={this.checkAndNext}
                        />
                    </View>
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default DestinationPicker;
