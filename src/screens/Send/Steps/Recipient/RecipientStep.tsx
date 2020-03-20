/* eslint-disable react/no-unused-state */

/**
 * Generate Account/Finish Screen
 */
import { v4 as uuidv4 } from 'uuid';
import React, { Component } from 'react';
import { Results } from 'realm';
import { isEmpty, flatMap, remove, get, uniqBy, has } from 'lodash';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    TouchableHighlight,
    SectionList,
    ActivityIndicator,
    LayoutAnimation,
    Alert,
} from 'react-native';
import { StringType, XrplDestination } from 'xumm-string-decode';
import { Decode } from 'xrpl-tagged-address-codec';

import { AccountRepository, ContactRepository } from '@store/repositories';
import { ContactSchema } from '@store/schemas/latest';

import { Images, AlertModal } from '@common/helpers';

import { BackendService, LedgerService } from '@services';

// components
import { Button, TextInput, Footer, InfoMessage } from '@components';

// locale
import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

// context
import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isSearching: boolean;
    isLoading: boolean;
    searchText: string;
    contacts: Results<ContactSchema>;
    searchResult: any[];
    scanResult: any;
}
/* Component ==================================================================== */
class RecipientStep extends Component<Props, State> {
    lookupTimeout: any;

    static contextType = StepsContext;
    context!: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isSearching: false,
            isLoading: false,
            searchText: '',
            contacts: ContactRepository.getContacts(),
            searchResult: [],
            scanResult: {
                to: '',
                tag: 0,
                xAddress: undefined,
            },
        };

        this.lookupTimeout = null;
    }

    onQRCodeRead = (result: XrplDestination) => {
        let address = result.to;
        let tag = result.tag && result.tag;

        // decode if it's x address
        if (result.to.startsWith('X')) {
            const decoded = Decode(result.to);
            address = decoded.account;
            // @ts-ignore
            tag = decoded.tag && decoded.tag;
        }

        this.setState({
            scanResult: {
                to: address,
                tag,
                xAddress: result.to,
            },
        });

        this.doLookUp(address);
    };

    doLookUp = (searchText: string) => {
        const { contacts } = this.state;

        clearTimeout(this.lookupTimeout);

        LayoutAnimation.easeInEaseOut();

        this.setState({
            isSearching: true,
            searchText,
        });

        // create empty search result array
        const searchResult = [] as any;

        // search for contacts
        contacts.forEach(item => {
            if (
                item.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1 ||
                item.address.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
            ) {
                searchResult.push({
                    id: uuidv4(),
                    name: item.name,
                    address: item.address,
                    tag: item.destinationTag,
                    avatar: Images.IconProfile,
                });
            }
        });

        // if text length is more than 4 do server lookup
        if (searchText.length >= 4) {
            this.lookupTimeout = setTimeout(() => {
                BackendService.lookup(encodeURIComponent(searchText))
                    .then((res: any) => {
                        if (!isEmpty(res) && res.error !== true) {
                            if (!isEmpty(res.matches)) {
                                res.matches.forEach((element: any) => {
                                    searchResult.push({
                                        id: uuidv4(),
                                        name: element.alias === element.account ? '' : element.alias,
                                        address: element.account,
                                        avatar: Images.IconMoreHorizontal,
                                    });
                                });
                            }
                        }
                    })
                    .catch(() => {})
                    .finally(() => {
                        LayoutAnimation.spring();

                        this.setState({
                            searchResult: uniqBy(searchResult, 'address'),
                            isSearching: false,
                        });
                    });
            }, 500);

            return;
        }

        this.setState({
            searchResult,
            isSearching: false,
        });
    };

    onSearch = (text: string) => {
        // cleanup
        // const searchText = text.replace(/\s/g, '');
        const searchText = text;

        // check if it's a xrp address
        const possibleAccountAddress = new RegExp(
            /[rX][rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{23,50}/,
        );

        // if it's X address decode it
        if (possibleAccountAddress.test(searchText) && searchText.startsWith('X')) {
            // decode if it's x address
            const decoded = Decode(searchText);
            if (decoded) {
                this.setState({
                    scanResult: {
                        to: decoded.account,
                        tag: decoded.tag,
                        xAddress: searchText,
                    },
                });
                this.doLookUp(decoded.account);
            } else {
                this.doLookUp(searchText);
            }
        } else {
            this.doLookUp(searchText);
        }
    };

    getSearchResultSource = () => {
        const { searchResult } = this.state;

        const dataSource = [];

        if (searchResult.length === 0) {
            dataSource.push({
                title: Localize.t('send.searchResults'),
                data: [{ empty: true, title: Localize.t('send.noSearchResult') }],
            });
        } else {
            dataSource.push({
                title: Localize.t('send.searchResults'),
                data: searchResult,
            });
        }

        return dataSource;
    };

    getDefaultDateSource = () => {
        const { source } = this.context;
        const { contacts } = this.state;

        const myAccounts = AccountRepository.findAll();

        const dataSource = [];

        const myAccountList = remove(Array.from(myAccounts), n => {
            // remove source account from list
            return n.address !== source.address;
        });

        if (myAccountList.length !== 0) {
            dataSource.push({
                title: Localize.t('account.myAccounts'),
                data: flatMap(myAccountList, a => {
                    return { name: a.label, address: a.address, avatar: Images.IconAccount };
                }),
            });
        }

        if (contacts.length === 0) {
            dataSource.push({
                title: Localize.t('global.contacts'),
                data: [{ empty: true, title: Localize.t('send.noContact') }],
            });
        } else {
            dataSource.push({
                title: Localize.t('global.contacts'),
                data: flatMap(contacts, a => {
                    return {
                        id: uuidv4(),
                        name: a.name,
                        address: a.address,
                        tag: a.destinationTag,
                        avatar: Images.IconProfile,
                    };
                }),
            });
        }

        return dataSource;
    };

    checkAndNext = async () => {
        const { setDestination, setDestinationInfo, amount, currency, destination, source, goNext } = this.context;

        this.setState({
            isLoading: true,
        });

        try {
            let shouldCheckAccountRisk = true;

            // check for same destination as source
            if (destination.address === source.address) {
                Alert.alert(Localize.t('global.error'), Localize.t('send.sourceAndDestinationCannotBeSame'));
                // don't move to next step
                return;
            }

            // check for account exist and potential destination tag required
            const destinationInfo = await LedgerService.getAccountInfo(destination.address);

            if (has(destinationInfo, 'error')) {
                if (get(destinationInfo, 'error') === 'actNotFound') {
                    // account doesn't exist no need to check account risk
                    shouldCheckAccountRisk = false;

                    if (typeof currency !== 'string') {
                        AlertModal({
                            type: 'warning',
                            text: Localize.t('send.destinationCannotActivateWithIOU'),
                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: () => {
                                        setDestination(undefined);
                                        this.setState({
                                            searchText: '',
                                        });
                                    },
                                    type: 'dismiss',
                                    light: false,
                                },
                            ],
                        });

                        // don't move to next step
                        return;
                    }

                    // check if amount is not covering the creation of account
                    if (typeof currency === 'string' && parseFloat(amount) < 20) {
                        AlertModal({
                            type: 'warning',
                            text: Localize.t('send.destinationNotExistTooLittleToCreate'),
                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: () => {
                                        setDestination(undefined);
                                        this.setState({
                                            searchText: '',
                                        });
                                    },
                                    type: 'dismiss',
                                    light: false,
                                },
                            ],
                        });

                        // don't move to next step
                        return;
                    }

                    // check if the amount will create the account
                    if (typeof currency === 'string' && parseFloat(amount) >= 20) {
                        AlertModal({
                            type: 'warning',
                            text: Localize.t('send.destinationNotExistCreationWarning', { amount }),
                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: () => {
                                        setDestination(undefined);
                                        this.setState({
                                            searchText: '',
                                        });
                                    },
                                    type: 'dismiss',
                                    light: true,
                                },
                                {
                                    text: Localize.t('global.continue'),
                                    onPress: goNext,
                                    type: 'continue',
                                    light: false,
                                },
                            ],
                        });

                        // don't move to next step
                        return;
                    }
                }
            }

            if (shouldCheckAccountRisk) {
                // check for account risk and scam
                const accountRisk = await BackendService.getAccountRisk(destination.address);

                if (accountRisk.danger !== 'ERROR' || accountRisk.danger !== 'UNKNOWS') {
                    if (accountRisk.danger === 'PROBABLE' || accountRisk.danger === 'HIGH_PROBABILITY') {
                        AlertModal({
                            type: 'warning',
                            text: Localize.t('send.destinationIsProbableIsScam'),
                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: () => {
                                        setDestination(undefined);
                                        this.setState({
                                            searchText: '',
                                        });
                                    },
                                    type: 'dismiss',
                                    light: false,
                                },
                                {
                                    text: Localize.t('global.continue'),
                                    onPress: goNext,
                                    type: 'continue',
                                    light: true,
                                },
                            ],
                        });

                        // don't move to next step
                        return;
                    }

                    if (accountRisk.danger === 'CONFIRMED') {
                        AlertModal({
                            type: 'error',
                            title: Localize.t('global.critical'),
                            text: Localize.t('send.destinationIsConfirmedAsScam'),

                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: () => {
                                        setDestination(undefined);
                                        this.setState({
                                            searchText: '',
                                        });
                                    },
                                    type: 'dismiss',
                                    light: false,
                                },
                            ],
                        });

                        // don't move to next step
                        return;
                    }
                }
            }

            // set account info
            setDestinationInfo(destinationInfo);
        } finally {
            this.setState({ isLoading: false });
        }

        // go to the next step if everything was fine
        goNext();
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={[AppStyles.p, AppStyles.bold]}>{title}</Text>
            </View>
        );
    };

    renderItem = (row: any) => {
        const { destination, setDestination } = this.context;
        const { item } = row;

        if (item.empty) {
            return <InfoMessage type="warning" label={item.title} />;
        }

        const selected = item.address === get(destination, 'address') && item.name === get(destination, 'name');

        return (
            <TouchableHighlight
                onPress={() => {
                    if (!selected) {
                        setDestination({
                            name: item.name,
                            address: item.address,
                            tag: item.tag,
                        });
                    } else {
                        setDestination(undefined);
                    }
                }}
                underlayColor="#FFF"
            >
                <View style={[styles.itemRow, selected ? styles.itemSelected : null]}>
                    <View style={styles.avatarContainer}>
                        <Image source={item.avatar} style={styles.avatarImage} />
                    </View>
                    <View style={AppStyles.paddingLeftSml}>
                        <Text style={[styles.title, selected ? styles.selectedText : null]}>
                            {item.name || 'Unknown'}
                        </Text>
                        <Text style={[styles.subtitle, selected ? styles.selectedText : null]}>{item.address}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    };

    renderContent = () => {
        const { searchText, isSearching } = this.state;

        if (isSearching) {
            return (
                <View style={[AppStyles.flex8, AppStyles.paddingTop]}>
                    <ActivityIndicator color={AppColors.blue} />
                </View>
            );
        }

        return (
            <View style={[AppStyles.flex8, AppStyles.paddingTopSml]}>
                <SectionList
                    sections={searchText ? this.getSearchResultSource() : this.getDefaultDateSource()}
                    renderItem={this.renderItem}
                    renderSectionHeader={this.renderSectionHeader}
                    keyExtractor={item => item.id}
                />
            </View>
        );
    };

    render() {
        const { goBack, destination } = this.context;
        const { searchText, isLoading } = this.state;

        return (
            <SafeAreaView testID="send-recipient-view" style={[AppStyles.pageContainerFull]}>
                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal]}>
                    <View style={[AppStyles.row]}>
                        <TextInput
                            placeholder={Localize.t('send.enterANameOrAddress')}
                            // containerStyle={styles.searchContainer}
                            inputStyle={styles.inputText}
                            containerStyle={styles.inputContainer}
                            onChangeText={this.onSearch}
                            value={searchText}
                            showScanner
                            scannerType={StringType.XrplDestination}
                            onScannerRead={this.onQRCodeRead}
                        />
                    </View>

                    {this.renderContent()}
                </View>

                {/* Bottom Bar */}
                <Footer style={[AppStyles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button
                            secondary
                            label={Localize.t('global.back')}
                            onPress={() => {
                                goBack();
                            }}
                        />
                    </View>
                    <View style={[AppStyles.flex2]}>
                        <Button
                            isLoading={isLoading}
                            textStyle={AppStyles.strong}
                            isDisabled={!destination}
                            label={Localize.t('global.next')}
                            onPress={() => {
                                this.checkAndNext();
                            }}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default RecipientStep;
