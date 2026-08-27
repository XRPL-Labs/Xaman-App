/**
 * Send / Recipient step
 */

import { isEmpty, flatMap, remove, get, uniqBy, toNumber } from 'lodash';
import Realm from 'realm';

import React, { Component } from 'react';
import { View, Text, SectionList, Alert, RefreshControl } from 'react-native';

import { StringType, XrplDestination } from 'xumm-string-decode';

import { AccountRepository, ContactRepository, CoreRepository } from '@store/repositories';
import { ContactModel, AccountModel } from '@store/models';

import { AppScreens } from '@common/constants';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { NormalizeCurrencyCode } from '@common/utils/monetary';
import { NormalizeDestination } from '@common/utils/codec';

import { BackendService, LedgerService, NetworkService, StyleService, ResolverService } from '@services';

import { Button, TextInput, Footer, InfoMessage } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { EnterDestinationTagOverlayProps } from '@screens/Overlay/EnterDestinationTag';
import { FlaggedDestinationOverlayProps } from '@screens/Overlay/FlaggedDestination';

import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
import {
    AccountObjectsRequest,
    AccountObjectsResponse,
    DepositAuthorizedRequest,
    DepositAuthorizedResponse,
    LedgerEntryRequest,
    LedgerEntryResponse,
} from '@common/libs/ledger/types/methods';
import { AccountAdvisoryResolveType, AccountNameResolveType } from '@services/ResolverService';
import { XAppBrowserModalProps } from '@screens/Modal/XAppBrowser';
import { XAppOrigin } from '@common/libs/payload';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';
import Advisory from '@common/helpers/advisory';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isSearching: boolean;
    isLoading: boolean;
    isDevMode: boolean;
    searchText: string;
    accounts: Realm.Results<AccountModel>;
    contacts: Realm.Results<ContactModel>;
    dataSource: any[];
}

const XAMAN_BACKEND_API_TIMEOUT = 10_000;

enum PassableChecks {
    ALLOW_BLACKHOLE_DEVMODE = 'ALLOW_BLACKHOLE_DEVMODE',
    AMOUNT_CREATE_ACCOUNT = 'AMOUNT_CREATE_ACCOUNT',
    PROBABLE_SCAM = 'PROBABLE_SCAM',
    CONFIRMED_SCAM = 'CONFIRMED_SCAM',
    DISALLOWED_XRP_FLAG = 'DISALLOWED_XRP_FLAG',
    SEND_AS_ALT_TX = 'SEND_AS_ALT_TX',
}

/* Component ==================================================================== */
class RecipientStep extends Component<Props, State> {
    lookupTimeout: any;
    sequence: number;

    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            isSearching: false,
            isLoading: false,
            searchText: '',
            isDevMode: coreSettings.developerMode,
            accounts: AccountRepository.getAccounts({ hidden: false }).sorted([['order', false]]),
            contacts: ContactRepository.getContacts(),
            dataSource: [],
        };

        this.lookupTimeout = null;
        this.sequence = 0;
    }

    componentDidMount() {
        const { scanResult } = this.context;

        // check any scan result exist
        if (scanResult) {
            this.doAccountLookUp(scanResult);
        } else {
            this.setDefaultDataSource();
        }
    }

    componentWillUnmount() {
        if (this.lookupTimeout) clearTimeout(this.lookupTimeout);
    }

    doAccountLookUp = async (result: XrplDestination) => {
        const { setDestination } = this.context;

        this.setState({
            searchText: result.to,
            isSearching: true,
        });

        // console.log('lookup')

        const { to, tag } = NormalizeDestination(result);

        if (to) {
            // console.log('ifto')
            const [accountInfo, addressInfo] = await Promise.all([
                Promise.race([
                    ResolverService.getAccountName(to, tag).catch(() => ({
                        name: '',
                        address: to,
                        tag: toNumber(tag) || undefined,
                        source: 'CATCH',
                        kycApproved: false,
                    })),
                    new Promise((resolve: (res: AccountNameResolveType) => void) => {
                        // console.log('resolving lookup')
                        setTimeout(() => {
                            // console.log('resolving lookup timeout, proceed')
                            resolve({
                                name: '',
                                address: to,
                                tag: toNumber(tag) || undefined,
                                source: 'TIMEOUT',
                                kycApproved: false,
                            });
                        }, XAMAN_BACKEND_API_TIMEOUT);
                    }),
                ]),
                Promise.race([
                    BackendService.getAddressInfo(to).catch(() => ({
                        account: '',
                        name: '',
                        domain: '',
                        blocked: false,
                        source: 'CATCH',
                        force_dtag: false,
                        kycApproved: false,
                        proSubscription: false,
                        xapp_identifier: '',
                        no_direct_send: 0,
                    })),
                    new Promise((resolve: (res: XamanBackend.AccountInfoResponse) => void) => { 
                        // console.log('resolving lookup')
                        setTimeout(() => {
                            // console.log('resolving lookup timeout, proceed')\
                            resolve({
                                account: '',
                                name: '',
                                domain: '',
                                blocked: false,
                                source: 'TIMEOUT',
                                force_dtag: false,
                                kycApproved: false,
                                proSubscription: false,
                                xapp_identifier: '',
                                no_direct_send: 0,
                            });
                        }, XAMAN_BACKEND_API_TIMEOUT);
                    }),
                ]),
            ]);

            this.setState({
                dataSource: this.getSearchResultSource([
                    {
                        name: accountInfo.name || '',
                        address: to,
                        tag,
                        source: accountInfo.source,
                        kycApproved: accountInfo.kycApproved,
                        accountInfo,
                        addressInfo,
                    },
                ]),
                isSearching: false,
            });

            // select as destination
            setDestination({ name: accountInfo.name || '', address: to, tag: toNumber(tag) || undefined });
        } else {
            // console.log('notif-to')
            this.doLookUp(result.to);
        }
    };

    setSearchResult = (searchResult: any) => {
        const { destination, setDestination } = this.context;

        // if search result only have one result select it
        if (searchResult && searchResult?.length === 1) {
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
                // console.log('lookup')
                const lookupResults = Promise.race([
                    BackendService.lookup(searchText).catch(() => { }),
                    new Promise((resolve: (res: void) => void) => {
                        // console.log('searchtext  lookup')
                        setTimeout(() => {
                            // console.log('searchtext lookup timeout, proceed')
                            resolve();
                        }, XAMAN_BACKEND_API_TIMEOUT);
                    }),
                ]);

                lookupResults
                    .then((res: any) => {
                        if (!isEmpty(res) && res.error !== true) {
                            if (!isEmpty(res.matches)) {
                                res.matches.forEach(async (element: any) => {
                                    // if payid in result, then look for payId in local source as well
                                    if (element.source === 'payid') {
                                        const internalResult = await ResolverService.getAccountName(
                                            element.account,
                                            element.tag,
                                            true,
                                        );

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
        const { setDestination } = this.context;

        this.setState({
            searchText,
        });

        // console.log('onsearch')

        if (searchText && searchText?.length > 0) {
            // check if it's a valid address
            // eslint-disable-next-line prefer-regex-literals
            const possibleAccountAddress = new RegExp(
                /[rX][rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{23,50}/,
            );

            if (possibleAccountAddress.test(searchText)) {
                // console.log('accountlookup')
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

        if (searchResult && searchResult?.length > 0) {
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
            return n.address !== source?.address;
        });

        if (myAccountList && myAccountList?.length !== 0) {
            dataSource.push({
                title: Localize.t('account.myAccounts'),
                data: flatMap(myAccountList, (a) => {
                    return { name: a.label, address: a.address };
                }),
            });
        }

        if (contacts && contacts?.length === 0) {
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

    showEnterDestinationTag = () => {
        const { setDestination, destination } = this.context;

        if (!destination) {
            return;
        }

        Navigator.showOverlay<EnterDestinationTagOverlayProps>(AppScreens.Overlay.EnterDestinationTag, {
            buttonType: 'next',
            destination,
            onFinish: (destinationTag: string) => {
                Object.assign(destination, { tag: destinationTag });
                setDestination(destination);
                this.goNext();
            },
            onScannerRead: ({ tag }: { tag: number }) => {
                Object.assign(destination, { tag: String(tag) });
                setDestination(destination);

                this.showEnterDestinationTag();
            },
            onScannerClose: this.showEnterDestinationTag,
        });
    };

    clearDestination = () => {
        const { setDestination } = this.context;

        setDestination(undefined);
    };

    resetResult = () => {
        this.clearDestination();

        this.setState(
            {
                searchText: '',
            },
            this.setDefaultDataSource,
        );
    };

    checkAndNext = async (passedChecks = [] as Array<PassableChecks>) => {
        const {
            setDestinationInfo,
            amount,
            token,
            destination,
            source,
            submitAsAltTxTypeTo,
            setCredentials,
        } = this.context;
        let { destinationInfo } = this.context;
        const { dataSource, isDevMode } = this.state;

        try {
            const searchItem: {
                accountInfo: any;
                addressInfo: XamanBackend.AccountInfoResponse;
            } = ((dataSource as any)?.[0]?.data || []).filter(
                (itm: { address: string }) => itm && itm?.address === destination?.address,
            )?.[0];
            if (searchItem && searchItem?.addressInfo) {
                if (searchItem?.addressInfo?.no_direct_send === 1) {
                    if (
                        typeof searchItem?.addressInfo?.xapp_identifier === 'string' &&
                        searchItem?.addressInfo?.xapp_identifier !== ''
                    ) {
                        setTimeout(() => {
                            Navigator.showAlertModal({
                                type: 'warning',
                                text: Localize.t('send.mustOpenxAppInstead'),
                                buttons: [
                                    {
                                        text: Localize.t('global.back'),
                                        onPress: this.resetResult,
                                        type: 'dismiss',
                                        light: true,
                                    },
                                    {
                                        text: Localize.t('global.continue'),
                                        onPress: () => {
                                            Navigator.popToRoot();
                                            requestAnimationFrame(() => {
                                                // dismiss the modal
                                                Navigator.dismissModal();
                                                requestAnimationFrame(() => {
                                                    Navigator.dismissOverlay();
                                                    setTimeout(() => {
                                                        Navigator.showModal<XAppBrowserModalProps>(
                                                            AppScreens.Modal.XAppBrowser,
                                                            {
                                                                identifier: searchItem?.addressInfo?.xapp_identifier!,
                                                                origin: XAppOrigin.MANUAL_SEND,
                                                                originData: {},
                                                            },
                                                            {
                                                                modalTransitionStyle:
                                                                    OptionsModalTransitionStyle.coverVertical,
                                                                modalPresentationStyle:
                                                                    OptionsModalPresentationStyle.overFullScreen,
                                                            },
                                                        );
                                                    }, 50);
                                                });
                                            });
                                        },
                                        type: 'continue',
                                    },
                                ],
                            });
                        }, 50);
                        return;
                    }

                    Alert.alert(Localize.t('global.error'), Localize.t('send.cannotOpenDirectly'));
                    return;
                }
            }
        } catch (e) {
            //
        }

        // double check, this should not be happening
        if (!destination || !source) {
            Alert.alert(Localize.t('global.error'), 'Source and Destination is required!');
            return;
        }

        try {
            this.setState({
                isLoading: true,
            });

            // check for same destination as source
            // IMMEDIATE REJECT
            if (destination.address === source.address) {
                Alert.alert(Localize.t('global.error'), Localize.t('send.sourceAndDestinationCannotBeSame'));
                // don't move to next step
                return;
            }

            // console.log('checkandnext')

            if (!destinationInfo) {
                // check for account exist and potential destination tag required
                // console.log('advisory')
                try {
                    destinationInfo = await Promise.race([
                        ResolverService.getAccountAdvisoryInfo(destination.address).catch(() => {
                            return {
                                exist: true,
                                danger: 'NONE',
                            };
                        }),
                        new Promise((resolve: (res: AccountAdvisoryResolveType) => void) => {
                            // console.log('advisory lookup')
                            setTimeout(() => {
                                // console.log('advisory lookup timeout, proceed')
                                resolve({
                                    exist: true,
                                    danger: 'NONE',
                                });
                            }, XAMAN_BACKEND_API_TIMEOUT);
                        }),
                    ]);

                } catch (e) {
                    // console.log('advisory error', e.message)
                    destinationInfo = {
                        exist: true,
                        danger: 'NONE',
                    };
                }
                
                // set destination account info
                setDestinationInfo(destinationInfo);
            }

            // console.log('___1')

            // check for account risk and scam
            if (
                (destinationInfo.danger === 'PROBABLE' || destinationInfo.danger === 'HIGH_PROBABILITY') &&
                passedChecks.indexOf(PassableChecks.PROBABLE_SCAM) === -1
            ) {
                setTimeout(() => {
                    Navigator.showAlertModal({
                        type: 'warning',
                        text: Localize.t('send.destinationIsProbableIsScam'),
                        buttons: [
                            {
                                text: Localize.t('global.back'),
                                onPress: this.resetResult,
                                type: 'dismiss',
                                light: false,
                            },
                            {
                                text: Localize.t('global.continue'),
                                onPress: this.checkAndNext.bind(null, [...passedChecks, PassableChecks.PROBABLE_SCAM]),
                                type: 'continue',
                                light: true,
                            },
                        ],
                    });
                }, 50);
                return;
            }

            // console.log('___2')

            if (destinationInfo.danger === 'CONFIRMED' && passedChecks.indexOf(PassableChecks.CONFIRMED_SCAM) === -1) {
                setTimeout(() => {
                    Navigator.showOverlay<FlaggedDestinationOverlayProps>(AppScreens.Overlay.FlaggedDestination, {
                        destination: destination.address,
                        onContinue: this.checkAndNext.bind(null, [...passedChecks, PassableChecks.CONFIRMED_SCAM]),
                        onDismissed: this.resetResult,
                    });
                }, 50);
                return;
            }

            // console.log('___3')

            // account doesn't exist no need to check account risk
            if (!destinationInfo.exist) {
                // account does not exist and cannot activate with IOU
                // IMMEDIATE REJECT
                if (typeof token !== 'string') {
                    setTimeout(() => {
                        Navigator.showAlertModal({
                            type: 'warning',
                            text: Localize.t('send.destinationCannotActivateWithIOU', {
                                baseReserve: NetworkService.getNetworkReserve().BaseReserve,
                                nativeAsset: NetworkService.getNativeAsset(),
                            }),
                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: this.clearDestination,
                                    type: 'dismiss',
                                    light: false,
                                },
                            ],
                        });
                    }, 50);
                    return;
                }

                // check if amount is not covering the creation of account
                // IMMEDIATE REJECT
                if (typeof token === 'string' && parseFloat(amount) < NetworkService.getNetworkReserve().BaseReserve) {
                    setTimeout(() => {
                        Navigator.showAlertModal({
                            type: 'warning',
                            text: Localize.t('send.destinationNotExistTooLittleToCreate', {
                                baseReserve: NetworkService.getNetworkReserve().BaseReserve,
                                nativeAsset: NetworkService.getNativeAsset(),
                            }),
                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: this.clearDestination,
                                    type: 'dismiss',
                                    light: false,
                                },
                            ],
                        });
                    }, 50);
                    return;
                }

                // check if the amount will create the account
                if (
                    typeof token === 'string' &&
                    parseFloat(amount) >= NetworkService.getNetworkReserve().BaseReserve &&
                    passedChecks.indexOf(PassableChecks.AMOUNT_CREATE_ACCOUNT) === -1
                ) {
                    setTimeout(() => {
                        Navigator.showAlertModal({
                            type: 'warning',
                            text: Localize.t('send.destinationNotExistCreationWarning', {
                                amount,
                                baseReserve: NetworkService.getNetworkReserve().BaseReserve,
                                nativeAsset: NetworkService.getNativeAsset(),
                            }),
                            buttons: [
                                {
                                    text: Localize.t('global.back'),
                                    onPress: this.clearDestination,
                                    type: 'dismiss',
                                    light: true,
                                },
                                {
                                    text: Localize.t('global.continue'),
                                    onPress: this.checkAndNext.bind(null, [
                                        ...passedChecks,
                                        PassableChecks.AMOUNT_CREATE_ACCOUNT,
                                    ]),
                                    type: 'continue',
                                    light: false,
                                },
                            ],
                        });
                    }, 50);

                    return;
                }
            }

            // console.log('___4')

            // check if recipient have proper trustline for receiving this IOU
            // ignore if the recipient is the issuer, or if approved to send alt tx
            if (
                typeof token !== 'string' &&
                token.currency.issuer !== destination.address &&
                passedChecks.indexOf(PassableChecks.SEND_AS_ALT_TX) === -1
            ) {
                const mpTokenDetails = token.isMPToken()
                    ? (await NetworkService.send({
                        command: 'ledger_entry',
                        mptoken: {
                            mpt_issuance_id: token.currency.currencyCode,
                            account: destination.address,
                        },                        
                    }) as any)?.node
                    : null;
                const destinationLine = token.isMPToken()
                    ? {
                        limit: 999999999,
                        balance: mpTokenDetails?.MPTAmount || 1,
                    }
                    : await LedgerService.getFilteredAccountLine(destination.address, {
                        currency: token.currency.currencyCode,
                        issuer: token.currency.issuer,
                    });
                
                // recipient does not have the proper trustline
                const noTL = !destinationLine ||
                    (Number(destinationLine.limit) === 0 && Number(destinationLine.balance) === 0);
                const exceedsTL = destinationLine &&
                    Number(amount) + Number(destinationLine.balance) > Number(destinationLine.limit);

                if (noTL || exceedsTL) {
                    if (
                        (destination.tag === undefined || destination.tag === null) &&
                        !destinationInfo.requireDestinationTag
                        // ^^ we're not making checks to those with destination tags
                    ) {
                        const nid = NetworkService.getNetworkId();
                        const type = nid === 21337 || nid === 21338
                            ? 'Remit'
                            : 'Check';

                        const altTlInstruction = nid === 21337 || nid === 21338 // Xahau / Xahau Testnet
                            ? Localize.t('send.altSendPaymentRecipientDoesNotHaveTrustLineXahau', {
                                asset: NetworkService.getNativeAsset(),
                                reserve: NetworkService.getNetworkReserve().OwnerReserve,
                            })
                            : Localize.t('send.altSendPaymentRecipientDoesNotHaveTrustLineXRPL', {
                                asset: NetworkService.getNativeAsset(),
                                reserve: NetworkService.getNetworkReserve().OwnerReserve,
                            });
                        
                        submitAsAltTxTypeTo(`${type}:${destination.address}`);

                        setTimeout(() => {
                            Navigator.showAlertModal({
                                type: 'warning',
                                text: exceedsTL
                                    ? `${Localize.t('send.unableToSendPaymentRecipientExceedTrustline')}\n\n${altTlInstruction}`
                                    : `${Localize.t('send.altSendPaymentRecipientDoesNotHaveTrustLine')}\n\n${altTlInstruction}`,
                                buttons: [
                                    {
                                        text: Localize.t('global.cancel'),
                                        onPress: this.clearDestination,
                                        light: true,
                                    },
                                    {
                                        text: Localize.t('send.altSendAs', {
                                            type,
                                        }),
                                        onPress: this.checkAndNext.bind(null, [
                                            ...passedChecks,
                                            PassableChecks.SEND_AS_ALT_TX,
                                        ]),
                                        light: false,
                                    },
                                ],
                            });
                        }, 50);
                        return;
                    }

                    // Destination tag, default msg
                    setTimeout(() => {
                        Navigator.showAlertModal({
                            type: 'error',
                            text: Localize.t('send.unableToSendPaymentRecipientDoesNotHaveTrustLine'),
                            buttons: [
                                {
                                    text: Localize.t('global.ok'),
                                    onPress: this.clearDestination,
                                    light: false,
                                },
                            ],
                        });
                    }, 50);
                    return;
                }

                // check if sending this payment will exceed the limit
                if (
                    destinationLine &&
                    Number(amount) + Number(destinationLine.balance) > Number(destinationLine.limit) &&
                    passedChecks.indexOf(PassableChecks.SEND_AS_ALT_TX) === -1
                    // ^^ if we're already sending alt, the limit doesn't matter.
                ) {
                    setTimeout(() => {
                        Navigator.showAlertModal({
                            type: 'error',
                            text: Localize.t('send.unableToSendPaymentTrustLineLimitIsExceeded'),
                            buttons: [
                                {
                                    text: Localize.t('global.ok'),
                                    onPress: this.clearDestination,
                                    light: false,
                                },
                            ],
                        });
                    }, 50);
                    return;
                }
            }

            // console.log('___5')
            // if account is set to black hole then reject sending
            // IMMEDIATE REJECT
            if (
                destinationInfo.blackHole &&
                passedChecks.indexOf(PassableChecks.ALLOW_BLACKHOLE_DEVMODE) === -1
            ) {
                setTimeout(() => {
                    const isXahau = NetworkService.getNativeAsset() === 'XAH';
                    const isHardBlackHole = Advisory.BLACK_HOLE_KEYS.includes(String(destination.address || '')) ||
                        Advisory.LOST_KEYS.includes(String(destination.address || ''));
                    
                    Navigator.showAlertModal({
                        type: (isXahau && !isHardBlackHole) ? 'warning' : 'error',
                        text: [
                            Localize.t('send.theDestinationAccountIsSetAsBlackHole', {
                                currency:
                                    typeof token === 'string'
                                        ? NetworkService.getNativeAsset()
                                        : NormalizeCurrencyCode(token.currency.currencyCode),
                            }),
                            ...(
                                (isXahau && !isHardBlackHole) ? [
                                    Localize.t('send.fundsMaybePermanentlyLost', {
                                        currency:
                                            typeof token === 'string'
                                                ? NetworkService.getNativeAsset()
                                                : NormalizeCurrencyCode(token.currency.currencyCode),
                                    }),
                                ] : [
                                    Localize.t('send.fundsPermanentlyLost', {
                                        currency:
                                            typeof token === 'string'
                                                ? NetworkService.getNativeAsset()
                                                : NormalizeCurrencyCode(token.currency.currencyCode),
                                    }),
                                ]
                            ),
                        ].join('\n\n'),
                        buttons: [
                            ...(
                                isDevMode
                                    ? [
                                        {
                                            text: Localize.t('tangemImportMsgs.existingButtonContinue'),
                                            onPress: this.checkAndNext.bind(null, [
                                                ...passedChecks,
                                                PassableChecks.ALLOW_BLACKHOLE_DEVMODE,
                                            ]),
                                            type: 'continue' as const,
                                            light: true,
                                        },
                                    ]
                                    : []
                            ),
                            ...[
                                {
                                    text: Localize.t('global.back'),
                                    onPress: this.clearDestination,
                                    type: 'dismiss' as const,
                                    light: false,
                                },
                            ],
                        ],
                    });
                }, 50);
                return;
            }

            // console.log('___6')

            // check for xrp income disallow
            if (
                destinationInfo.disallowIncomingXRP &&
                typeof token === 'string' &&
                passedChecks.indexOf(PassableChecks.DISALLOWED_XRP_FLAG) === -1
            ) {
                setTimeout(() => {
                    Navigator.showAlertModal({
                        type: 'warning',
                        text: Localize.t('send.sendToAccountWithDisallowNativeAssetFlagWarning', {
                            nativeAsset: NetworkService.getNativeAsset(),
                        }),
                        buttons: [
                            {
                                text: Localize.t('global.back'),
                                onPress: this.clearDestination,
                                type: 'dismiss',
                                light: false,
                            },
                            {
                                text: Localize.t('global.continue'),
                                onPress: this.checkAndNext.bind(null, [
                                    ...passedChecks,
                                    PassableChecks.DISALLOWED_XRP_FLAG,
                                ]),
                                type: 'continue',
                                light: true,
                            },
                        ],
                    });
                }, 50);
                return;
            }

            // console.log('___7')

            // check for destination tag require
            if (destinationInfo.requireDestinationTag && (!destination.tag || Number(destination.tag) === 0)) {
                setTimeout(() => {
                    this.showEnterDestinationTag();
                }, 50);

                // don't move to next step
                return;
            }

            let notAuthorized = false;
            
            if (
                source?.address &&
                destination?.address &&
                passedChecks.indexOf(PassableChecks.AMOUNT_CREATE_ACCOUNT) === -1
                // ^^ If creating account, don't check authorisation
            ) {
                const isAuthorized = await NetworkService.send<DepositAuthorizedRequest, DepositAuthorizedResponse>({
                    command: 'deposit_authorized',
                    source_account: source.address,
                    destination_account: destination.address,
                });

                // console.log('___7a', isAuthorized)

                if (((isAuthorized as any) || {})?.deposit_authorized === false) {
                    // Not authorised, let's check if it's a credential thing
                    const ownedCredentials = (await NetworkService.send<AccountObjectsRequest, AccountObjectsResponse>({
                        command: 'account_objects',
                        type: 'credential',
                        account: source.address,
                    }) as any)?.account_objects?.filter((o: { Flags: number }) => o.Flags > 0); // Must be accepted

                    if (ownedCredentials?.length < 1) {
                        // We can't satisfy this anyway, so let's just inform the user
                        notAuthorized = true;
                    }

                    // console.log('___7b', ownedCredentials)

                    // So this account has credentials, let's see if there's one that would satisfy the
                    // destination's PreAuth
                    const credentialMatch = (ownedCredentials
                        ? (await Promise.all(ownedCredentials?.map((credential: {
                            Issuer: string;
                            CredentialType: string;
                        }) => {
                            // console.log('___7c')
                            return NetworkService.send<LedgerEntryRequest, LedgerEntryResponse>({
                                command: 'ledger_entry',
                                deposit_preauth: {
                                    owner: destination.address,
                                    authorized_credentials: [{
                                        issuer: credential.Issuer,
                                        credential_type: credential.CredentialType,
                                    }],
                                },
                            });
                        })) as any)
                    : [])
                        ?.filter((authorisation: {
                            node: {
                                AuthorizeCredentials: { Credential: { Issuer: string; CredentialType: string } }[];
                            };
                        }) => authorisation?.node?.AuthorizeCredentials?.length > 0)
                        ?.map((authorisation: {
                            node: {
                                AuthorizeCredentials: { Credential: { Issuer: string; CredentialType: string } }[];
                            };
                        }) => authorisation?.node?.AuthorizeCredentials?.[0]?.Credential)
                        ?.[0];

                    // console.log('___7d', credentialMatch)

                    if (credentialMatch) {
                        const useCredential = ownedCredentials?.filter((credential: {
                            Issuer: string;
                            CredentialType: string;
                        }) => {
                            return credential.Issuer === credentialMatch.Issuer &&
                                credential.CredentialType === credentialMatch.CredentialType;
                        })?.[0];

                        if (useCredential && useCredential?.index) {
                            // We're good
                            setCredentials([useCredential.index]);
                        } else {
                            notAuthorized = true;
                        }
                    } else {
                        notAuthorized = true;
                    }

                    if (notAuthorized) {
                        setTimeout(() => {
                            Navigator.showAlertModal({
                                type: 'warning',
                                text: Localize.t('send.theDestinationAccountDidNotAuthorize'),
                                buttons: [
                                    {
                                        text: Localize.t('global.back'),
                                        onPress: this.clearDestination,
                                        type: 'dismiss',
                                        light: false,
                                    },
                                ],
                            });
                        }, 50);
                        return;
                    }
                }
            };

            // console.log('___8')
        } catch (e) {
            Toast(Localize.t('send.unableGetRecipientAccountInfoPleaseTryAgain'));
            // console.log(e.message, e.stack);
            return;
        } finally {
            this.setState({ isLoading: false });
        }

        // go to the next step if everything was fine
        await this.goNext();
    };

    onScannerRead = (content: any) => {
        if (content.payId) {
            this.doAccountLookUp({ to: content.payId });
        } else {
            this.doAccountLookUp(content);
        }
    };

    goNext = async () => {
        const { goNext, setIssuerFee, source, destination, token } = this.context;

        // double check, this should not be happening
        if (!destination || !source) {
            Alert.alert(Localize.t('global.error'), 'Source and Destination is required!');
            return;
        }

        try {
            this.setState({
                isLoading: true,
            });

            // sending IOU && SENDER AND DESTINATION is not issuer, get issuer fee
            if (
                typeof token !== 'string' &&
                source.address !== token.currency.issuer &&
                destination.address !== token.currency.issuer
            ) {
                // fetching/applying issuer fee from network
                const issuerFee = await LedgerService.getAccountTransferRate(token.currency.issuer);
                if (issuerFee) {
                    setIssuerFee(issuerFee);
                }
            }

            // move to summary step
            goNext();
        } catch (e) {
            this.setState({ isLoading: false });
            Toast(Localize.t('send.unableToSetFeesPleaseTryAgain'));
        }
    };

    goBack = () => {
        const { goBack } = this.context;

        this.clearDestination();

        goBack();
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
                    <View style={[
                        AppStyles.flex1,
                        styles.restoreMarginRight,
                    ]}>
                        <Button
                            onPress={this.resetResult}
                            style={styles.clearSearchButton}
                            roundedMini
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
        const { isLoading } = this.state;
        const { destination, setDestination } = this.context;
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
                    if (isLoading) {
                        return;
                    }
                    if (!selected) {
                        setDestination({
                            name: item.name,
                            address: item.address,
                            tag: item.tag === null ? undefined : (toNumber(item.tag) || undefined),
                        });
                    } else {
                        setDestination(undefined);
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
                    <View style={[
                        AppStyles.flex1,
                        styles.restoreMarginRight,
                    ]}>
                        <Button
                            onPress={() => {
                                // clear search text
                                this.setState({
                                    searchText: '',
                                });
                                // clear the destination if any set
                                this.clearDestination();
                                // set the default source
                                this.setDefaultDataSource();
                            }}
                            style={styles.clearSearchButton}
                            roundedMini
                            light
                            label={Localize.t('global.clearSearch')}
                        />
                    </View>
                </View>
                <View style={[
                    AppStyles.paddingVerticalSml,
                ]}>
                    <InfoMessage type="warning" label={Localize.t('send.noSearchResult')} />
                </View>
            </>
        );
    };

    render() {
        const { destination } = this.context;
        const { searchText, isSearching, isLoading, dataSource } = this.state;

        if (!dataSource) return null;

        return (
            <View testID="send-recipient-view" style={AppStyles.container}>
                <View style={[AppStyles.contentContainer, styles.paddingHorizontal]}>
                    <View style={AppStyles.row}>
                        <TextInput
                            placeholder={Localize.t('send.enterANameOrAddress')}
                            // containerStyle={styles.searchContainer}
                            autoComplete="off"
                            textContentType="none"
                            importantForAutofill="no"
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
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

                    <View style={[AppStyles.flex8, AppStyles.paddingTopSml, styles.accountList]}>
                        <SectionList
                            ListEmptyComponent={this.renderListEmptyComponent}
                            extraData={searchText}
                            sections={dataSource}
                            renderItem={this.renderItem}
                            renderSectionHeader={this.renderSectionHeader}
                            keyExtractor={(item) => `${item.address}${item.tag}`}
                            refreshControl={
                                <RefreshControl refreshing={isSearching} tintColor={StyleService.value('$contrast')} />
                            }
                            indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
                        />
                    </View>
                </View>

                {/* Bottom Bar */}
                <Footer style={AppStyles.row} safeArea>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button
                            light
                            icon="IconChevronLeft"
                            label={Localize.t('global.back')}
                            onPress={this.goBack}
                        />
                    </View>
                    <View style={AppStyles.flex2}>
                        <Button
                            isLoading={isLoading}
                            textStyle={AppStyles.strong}
                            isDisabled={!destination}
                            icon="IconChevronRight"
                            iconPosition="right"
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
export default RecipientStep;
