import { AccountModel, CoreModel, NetworkModel } from '@store/models';
import { XAppOrigin } from '@common/libs/payload';
import { Destination } from '@common/libs/ledger/parser/types';
import { AccountAdvisoryResolveType } from '@services/ResolverService';
import { Images } from '@common/helpers/images';
// import { type ChildrenProps } from '@components/General/Header/Header';

export interface Props {
    identifier: string;
    params?: any;
    title?: string;
    icon?: string;
    account?: AccountModel;
    origin?: XAppOrigin;
    originData?: any;
    noSwitching?: boolean;
    altHeader?: {
        left?: {
            icon?: Extract<keyof typeof Images, string>;
            iconSize?: number;
            onPress?: string;
            onPressOptions?: {
                [key: string]: any;
            };
        };
        center?: {
            text?: string;
            showNetworkLabel?: boolean;
        };
        right?: {
            icon?: Extract<keyof typeof Images, string>;
            iconSize?: number;
            onPress?: string;
            onPressOptions?: {
                [key: string]: any;
            };
        };
    };
}

export interface State {
    ott?: string;
    app?: {
        title?: string;
        icon?: string;
        identifier: string;
        appid?: string;
        supportUrl?: string;
        permissions?: {
            special: string[];
            commands: string[];
        };
        networks?: string[];
        __ott?: string;
    };
    account: AccountModel;
    network: NetworkModel;
    error?: Error;
    isLaunchingApp: boolean;
    isLoadingApp: boolean;
    isAppReady: boolean;
    isAppReadyTimeout: boolean;
    isRequiredNetworkSwitch: boolean;
    coreSettings: CoreModel;
    appVersionCode: string;
}

export enum XAppMethods {
    SelectDestination = 'selectDestination',
    OpenSignRequest = 'openSignRequest',
    PayloadResolved = 'payloadResolved',
    XAppNavigate = 'xAppNavigate',
    OpenBrowser = 'openBrowser',
    GetLogs = 'getLogs',
    TxDetails = 'txDetails',
    KycVeriff = 'kycVeriff',
    ScanQr = 'scanQr',
    Share = 'share',
    Close = 'close',
    Ready = 'ready',
    NetworkSwitch = 'networkSwitch',
    RequestInAppPurchase = 'requestInAppPurchase',
}

export enum XAppSpecialPermissions {
    UrlLaunchNoConfirmation = 'URL_LAUNCH_NO_CONFIRMATION',
    NetworkSwitchEventNoReload = 'NETWORK_SWITCH_EVENT_NO_RELOAD',
}

export interface IEvent {
    method: string;
    reason?: string;
    uuid?: string;
    qrContents?: string;
    destination?: Destination;
    info?: AccountAdvisoryResolveType;
    result?: any;
    network?: string;
    successPurchase?: boolean;
}
