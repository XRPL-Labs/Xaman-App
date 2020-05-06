/**
 * Send / Recipient step
 */

import React, { Component } from 'react';
import { Results } from 'realm';
import { isEmpty, flatMap, remove, get, uniqBy, toNumber } from 'lodash';
import { View, Text, Image, TouchableHighlight, SectionList, Alert, ActivityIndicator } from 'react-native';
import { StringType, XrplDestination } from 'xumm-string-decode';

import { AccountRepository, ContactRepository } from '@store/repositories';
import { ContactSchema, AccountSchema } from '@store/schemas/latest';

import { AppScreens } from '@common/constants';
import { getAccountName, getAccountInfo } from '@common/helpers/resolver';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import { BackendService } from '@services';

// components
import { Button, TextInput, Footer, InfoMessage } from '@components';

// locale
import Localize from '@locale';

import { NormalizeDestination } from '@common/libs/utils';

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
    accounts: Results<AccountSchema>;
    contacts: Results<ContactSchema>;
    dataSource: any[];
}
/* Component ==================================================================== */
class RecipientStep extends Component<Props, State> {
    lookupTimeout: any;
    sequence: number;

    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isSearching: false,
            isLoading: false,
            searchText: '',
            accounts: AccountRepository.getAccounts().snapshot(),
            contacts: ContactRepository.getContacts().snapshot(),
            dataSource: [],
        };

        this.lookupTimeout = null;
        this.sequence = 0;
    }

    componentDidMount() {
        const { scanResult } = this.context;

        // if scanResult is passed
        if (scanResult) {
            this.doAccountLookUp({ to: scanResult.to, tag: scanResult.tag });
        } else {
            this.setDefaultDataSource();
        }
    }

    doAccountLookUp = async (result: XrplDestination) => {
        const { setDestination } = this.context;

        this.setState({
            searchText: result.to,
            isSearching: true,
        });

        const { to, tag } = NormalizeDestination(result);

        if (to) {
            const accountInfo = await getAccountName(to, tag);

            let avatar;

            switch (accountInfo.source) {
                case 'internal:contacts':
                    avatar = Images.IconProfile;
                    break;
                case 'internal:accounts':
                    avatar = Images.IconAccount;
                    break;
                default:
                    avatar = Images.IconGlobe;
                    break;
            }

            this.setState({
                dataSource: this.getSearchResultSource([
                    {
                        name: accountInfo.name || '',
                        address: to,
                        tag,
                        avatar,
                        source: accountInfo.source.replace('internal:', ''),
                    },
                ]),
                isSearching: false,
            });

            // select as destination
            setDestination({ name: accountInfo.name || '', address: to, tag: toNumber(tag) || undefined });
        } else {
            this.doLookUp(result.to);
        }
    };

    setSearchResult = (searchResult: any) => {
        const { destination, setDestination } = this.context;

        // if search result only have one result select it
        if (searchResult.length === 1) {
            const onlyResult = searchResult[0];
            // select as destination
            if (!destination || (onlyResult.address !== destination.address && onlyResult.tag !== destination.tag)) {
                setDestination({
                    name: onlyResult.name || '',
                    address: onlyResult.address,
                    tag: toNumber(onlyResult.tag) || undefined,
                });
            }
        } else if (destination) {
            setDestination(undefined);
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
                    item.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1 ||
                    item.address.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
                ) {
                    searchResult.push({
                        name: item.name,
                        address: item.address,
                        tag: item.destinationTag,
                        avatar: Images.IconProfile,
                    });
                }
            });

            // search for contacts
            accounts.forEach((item) => {
                if (
                    item.label.toLowerCase().indexOf(searchText.toLowerCase()) !== -1 ||
                    item.address.toLowerCase().indexOf(searchText.toLowerCase()) !== -1
                ) {
                    searchResult.push({
                        name: item.label,
                        address: item.address,
                        avatar: Images.IconAccount,
                    });
                }
            });

            // if text length is more than 4 do server lookup
            if (searchText.length >= 4) {
                BackendService.lookup(searchText)
                    .then((res: any) => {
                        if (!isEmpty(res) && res.error !== true) {
                            if (!isEmpty(res.matches)) {
                                res.matches.forEach((element: any) => {
                                    searchResult.push({
                                        name: element.alias === element.account ? '' : element.alias,
                                        address: element.account,
                                        avatar: Images.IconGlobe,
                                        source: element.source,
                                        tag: element.tag,
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
        const { setDestination } = this.context;

        this.setState({
            searchText,
        });

        if (searchText && searchText.length > 0) {
            // check if it's a xrp address
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
            // get default source
            this.setDefaultDataSource();
            // clear the destination if set
            setDestination(undefined);
        }
    };

    getSearchResultSource = (searchResult: any) => {
        const dataSource = [];

        if (searchResult.length > 0) {
            dataSource.push({
                title: Localize.t('send.searchResults'),
                data: uniqBy(searchResult, 'address'),
            });
        }

        return dataSource;
    };

    setDefaultDataSource = () => {
        const { source } = this.context;
        const { contacts, accounts } = this.state;

        const dataSource = [];

        const myAccountList = remove(Array.from(accounts), (n) => {
            // remove source account from list
            return n.address !== source.address;
        });

        if (myAccountList.length !== 0) {
            dataSource.push({
                title: Localize.t('account.myAccounts'),
                data: flatMap(myAccountList, (a) => {
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
                data: flatMap(contacts, (a) => {
                    return {
                        name: a.name,
                        address: a.address,
                        tag: a.destinationTag,
                        avatar: Images.IconProfile,
                    };
                }),
            });
        }

        this.setState({
            dataSource,
        });
    };

    checkAndNext = async () => {
        const { setDestination, setDestinationInfo, amount, currency, destination, source, goNext } = this.context;

        this.setState({
            isLoading: true,
        });

        try {
            // check for same destination as source
            if (destination.address === source.address) {
                Alert.alert(Localize.t('global.error'), Localize.t('send.sourceAndDestinationCannotBeSame'));
                // don't move to next step
                return;
            }

            // check for account exist and potential destination tag required
            const destinationInfo = await getAccountInfo(destination.address);

            // set destination account info
            setDestinationInfo(destinationInfo);

            // account doesn't exist no need to check account risk
            if (!destinationInfo.exist) {
                // account does not exist and cannot activate with IOU
                if (typeof currency !== 'string') {
                    Navigator.showAlertModal({
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
                    Navigator.showAlertModal({
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
                    Navigator.showAlertModal({
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

            // check for account risk and scam
            if (destinationInfo.risk === 'PROBABLE' || destinationInfo.risk === 'HIGH_PROBABILITY') {
                Navigator.showAlertModal({
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

            if (destinationInfo.risk === 'CONFIRMED') {
                Navigator.showAlertModal({
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

            if (destinationInfo.requireDestinationTag && (!destination.tag || Number(destination.tag) === 0)) {
                Navigator.showOverlay(
                    AppScreens.Overlay.EnterDestinationTag,
                    {
                        layout: {
                            backgroundColor: 'transparent',
                            componentBackgroundColor: 'transparent',
                        },
                    },
                    {
                        buttonType: 'next',
                        destination,
                        onFinish: (destinationTag: string) => {
                            Object.assign(destination, { tag: destinationTag });
                            setDestination(destination);
                            goNext();
                        },
                    },
                );

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
        goNext();
    };

    onScannerRead = (content: any) => {
        if (content.payId) {
            this.doAccountLookUp({ to: content.payId });
        } else {
            this.doAccountLookUp(content);
        }
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        const { setDestination } = this.context;
        const { dataSource } = this.state;

        if (title === Localize.t('send.searchResults')) {
            return (
                <View style={[styles.sectionHeader, AppStyles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Text style={[AppStyles.p, AppStyles.bold]}>
                            {title} {dataSource[0].data.length > 0 && `(${dataSource[0].data.length})`}
                        </Text>
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <Button
                            onPress={() => {
                                // clear search text
                                this.setState({
                                    searchText: '',
                                });
                                // clear the destination if any set
                                setDestination(undefined);
                                // set the default source
                                this.setDefaultDataSource();
                            }}
                            style={styles.clearSearchButton}
                            light
                            roundedMini
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
        const { destination, setDestination } = this.context;
        const { item } = row;

        if (item.empty) {
            return <InfoMessage type="warning" label={item.title} />;
        }

        const selected = item.address === get(destination, 'address') && item.name === get(destination, 'name');

        let tag;

        switch (item.source) {
            case 'xrplns':
                tag = (
                    <View style={[styles.tag, styles.xrplnsTag]}>
                        <Text style={styles.tagLabel}>XRPLNS</Text>
                    </View>
                );
                break;
            case 'bithomp.com':
                tag = (
                    <View style={[styles.tag, styles.bithompTag]}>
                        <Text style={styles.tagLabel}>Bithomp</Text>
                    </View>
                );
                break;
            case 'payid':
                tag = (
                    <View style={[styles.tag, styles.payidTag]}>
                        <Text style={styles.tagLabel}>PayID</Text>
                    </View>
                );
                break;
            default:
                break;
        }

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
                key={item.id}
            >
                <View style={[styles.itemRow, selected ? styles.itemSelected : null]}>
                    <View style={styles.avatarContainer}>
                        <Image source={item.avatar} style={styles.avatarImage} />
                    </View>
                    <View style={AppStyles.paddingLeftSml}>
                        <View style={AppStyles.row}>
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={[styles.title, selected ? styles.selectedText : null]}
                            >
                                {item.name || Localize.t('global.noNameFound')}
                            </Text>
                            {tag && tag}
                        </View>
                        <Text style={[styles.subtitle, selected ? styles.selectedText : null]}>{item.address}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    };

    renderListEmptyComponent = () => {
        const { setDestination } = this.context;

        return (
            <>
                <View style={[styles.sectionHeader, AppStyles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('send.searchResults')}</Text>
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <Button
                            onPress={() => {
                                // clear search text
                                this.setState({
                                    searchText: '',
                                });
                                // clear the destination if any set
                                setDestination(undefined);
                                // set the default source
                                this.setDefaultDataSource();
                            }}
                            style={styles.clearSearchButton}
                            light
                            roundedMini
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
        const { goBack, destination } = this.context;
        const { searchText, isSearching, isLoading, dataSource } = this.state;

        if (!dataSource) return null;

        return (
            <View testID="send-recipient-view" style={[AppStyles.pageContainerFull]}>
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
                            onScannerRead={this.onScannerRead}
                            scannerFallback
                        />
                    </View>

                    <View style={[AppStyles.flex8, AppStyles.paddingTopSml]}>
                        {isSearching ? (
                            <ActivityIndicator color={AppColors.blue} />
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
                <Footer style={[AppStyles.row]} safeArea>
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
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default RecipientStep;
