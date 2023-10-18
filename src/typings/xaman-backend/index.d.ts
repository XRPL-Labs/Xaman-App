declare namespace XamanBackend {
    interface CuratedIOUsResponse {
        version: number;
        changed: boolean;
        network: string;
        issuers: string[];
        currencies: string[];
        details: {
            [key: string]: {
                id: number;
                name: string;
                domain: string;
                avatar: string;
                shortlist: number;
                info_source: {
                    type: string;
                    source: string;
                };
                currencies: {
                    [key: string]: {
                        id: number;
                        issuer_id: number;
                        issuer: string;
                        currency: string;
                        name: string;
                        avatar: string;
                        shortlist: number;
                        info_source: {
                            type: string;
                            source: string;
                        };
                        xapp_identifier: string | null;
                    };
                };
            };
        };
    }
    interface AddUserResponse {
        user: {
            uuid: string;
        };
        device: {
            uuid: string;
            expire: string;
        };
    }
    interface ActivateDeviceResponse {
        activated: boolean;
        accessToken: string;
        locked: boolean;
    }
    interface PingResponse {
        pong: boolean;
        env: {
            hasPro: boolean;
            appVersion: string;
            appLanguage: string;
            appCurrency: string;
        };
        tosAndPrivacyPolicyVersion: number;
        railsVersion: number;
        badge: number;
        auth: {
            user: {
                uuidv4: string;
                slug: string;
                name: string;
            };
            device: {
                uuidv4: string;
                idempotence: number;
            };
            call: {
                hash: string;
                idempotence: number;
                uuidv4: string;
            };
        };
    }
    interface ThirdPartyPermission {
        app: {
            id: string;
            name: string;
            description: string;
            icon: string;
        };
        urls: {
            homepage?: string;
            terms?: string;
            support?: string;
            privacy?: string;
        };
        grant: {
            validity: number;
            issued: string;
            expires: string;
        };
        report?: string;
    }

    interface ThirdPartyPermissionResponse extends Array<ThirdPartyPermission> {}

    interface RevokeThirdPartyPermissionResponse {
        commit: boolean;
    }
    interface AddTransactionResponse {
        done: boolean;
    }
    interface AddAccountResponse {
        done: boolean;
    }
    interface AccountInfoResponse {
        account: string;
        name: string | null;
        domain: string;
        blocked: boolean;
        source: string;
        force_dtag: boolean;
        kycApproved: boolean;
        proSubscription: boolean;
    }
    interface HandleLookupResponse {
        input: string;
        live: boolean;
        force_dtag: boolean;
        cached: number;
        explicitTests: {
            emailAddress: boolean;
            xrplAccount: boolean;
        };
        matches: {
            source: string;
            network: string | null;
            alias: string;
            account: string;
            tag: string | null;
            description: string;
            kycApproved: boolean;
        }[];
    }
    interface AccountAdvisoryResponse {
        account: string;
        danger: string;
        force_dtag: boolean;
        confirmations: any;
    }
    interface AppCategory {
        title: string;
        category: string;
        identifier: string;
        icon: string;
        listed: boolean;
        personal_flag_based: boolean;
        development: boolean;
        suppress: boolean;
    }
    interface XAppStoreListingsResponse {
        categories: {
            featured: AppCategory[];
            popular: AppCategory[];
            recent: AppCategory[];
            all: AppCategory[];
        };
    }
    interface XAppShortListResponse {
        apps: {
            title: string;
            icon: string;
            identifier: string;
            condition?: string;
            _type: string;
        }[];
    }
    interface XappLunchDataType {
        version: string;
        locale: string;
        currency: string;
        style: string;
        nodetype: string;
        nodewss: string;
        origin?: {
            type: string;
            data: string;
        };
        params?: Record<string, any>;
        account?: string;
        accounttype?: string;
        accountaccess?: string;
        xAppNavigateData?: Record<string, any>;
    }
    interface XappLunchTokenResponse {
        ott: string;
        xappTitle: string;
        allowForCurrentNetwork: boolean;
        xappSupportUrl: string;
        error: string;
        icon: string;
        permissions: {
            special: string[];
            commands: string[];
        };
    }
    interface XappInfoResponse {
        name: string;
        description: string;
        developerName: string | null;
        supportUrl: string;
        websiteUrl: string;
        termsUrl: string;
        privacyUrl: string;
        donateAddress: string;
        donation: boolean;
        networks: string[];
    }
    interface CurrenciesResponse {
        locale: string;
        currencies: {
            popular: Record<
                string,
                {
                    name: string;
                    code: string;
                    symbol: string;
                    isoDecimals: number;
                }
            >;
        };
        error: string;
    }
    interface AuditTrailResponse {
        processed: boolean;
    }
    interface CurrencyRateResponse {
        USD: number;
        XRP: number;
        __meta: {
            currency: {
                en: string;
                code: string;
                symbol: string;
                isoDecimals: number;
            };
        };
    }
    interface NetworkRailsResponse {
        [key: string]: {
            chain_id: number;
            color: string;
            name: string;
            is_livenet: boolean;
            native_asset: string;
            endpoints: {
                name: string;
                url: string;
            }[];
            explorers: {
                name: string;
                url_tx: string;
                url_ctid?: string;
                url_account: string;
            }[];
            rpc: string;
            definitions: string;
            icons: Icons;
        };
    }

    declare enum RatesInCurrency {
        to = 'to',
        from = 'from',
    }
    interface LiquidityBoundaries {
        issuer: string;
        iou: string;
        options: {
            timeoutSeconds?: number;
            includeBookData?: boolean;
            verboseBookData?: boolean;
            rates?: RatesInCurrency;
            maxSpreadPercentage?: number;
            maxSlippagePercentage?: number;
            maxSlippagePercentageReverse?: number;
            maxBookLines?: number;
        };
    }

    // TODO: add /v1/app/xls20-details - /v1/app/xls20-offered/{account}
}
