/**
 * Resolver Service
 * This service is responsible to resolve account related details including names, issuer token details etc ...
 */

import moment from 'moment-timezone';
import LoggerService, { LoggerInstance } from '@services/LoggerService';

import BackendService from '@services/BackendService';
import LedgerService from '@services/LedgerService';

import ContactRepository, { ContactRepositoryEvent } from '@store/repositories/contact';
import AccountRepository, { AccountRepositoryEvent } from '@store/repositories/account';

import { AccountDetailsModel, AccountModel, ContactModel, CurrencyModel } from '@store/models';

import Advisory from '@common/helpers/advisory';

import LRUCache from '@common/utils/cache';
import { CurrencyRepository } from '@store/repositories';
import { CurrencyRepositoryEvent } from '@store/repositories/currency';
import { PromiseQueue } from '@common/utils/queue';

/* Types  ==================================================================== */
export interface PayIDInfo {
    account: string;
    tag: string | null;
}

export interface AccountNameResolveType {
    address: string;
    tag?: number;
    name?: string;
    source?: string;
    kycApproved?: boolean;
    blocked?: boolean;
}

export interface AccountAdvisoryResolveType {
    exist: boolean;
    danger: string;
    requireDestinationTag?: boolean;
    possibleExchange?: boolean;
    disallowIncomingXRP?: boolean;
    blackHole?: boolean;
}

/* Service  ==================================================================== */
class ResolverService {
    private static AccountNameCacheSize = 300;

    private accountNameCache: LRUCache<string, Promise<AccountNameResolveType> | AccountNameResolveType>;
    private promiseQueue: PromiseQueue;
    private logger: LoggerInstance;

    constructor() {
        this.accountNameCache = new LRUCache<string, Promise<AccountNameResolveType> | AccountNameResolveType>(
            ResolverService.AccountNameCacheSize,
        );

        this.promiseQueue = new PromiseQueue(3);

        this.logger = LoggerService.createLogger('ResolverService');
    }

    initialize = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            try {
                // add listeners for account changes for updating the cache
                (['accountCreate', 'accountRemove', 'accountUpdate'] as (keyof AccountRepositoryEvent)[]).forEach(
                    (event) => AccountRepository.on(event, this.onAccountsChange),
                );

                // add listeners for contact changes for updating the cache
                (['contactCreate', 'contactRemove', 'contactUpdate'] as (keyof ContactRepositoryEvent)[]).forEach(
                    (event) => ContactRepository.on(event, this.onContactChange),
                );

                (['currencyUpsert'] as (keyof CurrencyRepositoryEvent)[]).forEach((event) =>
                    CurrencyRepository.on(event, this.onCurrencyUpsert),
                );

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * reinstate service
     */
    reinstate = () => {
        // remove account listeners
        (['accountCreate', 'accountRemove', 'accountUpdate'] as (keyof AccountRepositoryEvent)[]).forEach((event) =>
            AccountRepository.off(event, this.onAccountsChange),
        );

        // remove contact listeners
        (['contactCreate', 'contactRemove', 'contactUpdate'] as (keyof ContactRepositoryEvent)[]).forEach((event) =>
            ContactRepository.off(event, this.onContactChange),
        );

        // remove currency listeners
        (['currencyUpsert'] as (keyof CurrencyRepositoryEvent)[]).forEach((event) =>
            CurrencyRepository.off(event, this.onCurrencyUpsert),
        );
    };

    private onCurrencyUpsert = async (currency: CurrencyModel) => {
        // 24 hours considered outdated
        const isCurrencyOutdated = moment(currency.updatedAt).isBefore(moment().subtract(24, 'hours'));

        // if currency is outdated then start syncing
        if (isCurrencyOutdated) {
            this.promiseQueue.enqueue(currency.issuer, () =>
                BackendService.syncTokensDetails(currency.issuer).catch(this.logger.error),
            );
        }
    };

    private onAccountsChange = (
        account: Partial<AccountModel>,
        changes?: Partial<AccountModel> | Partial<AccountDetailsModel>,
    ) => {
        // remove the cache if account is added/removed/updated
        if (account?.address) {
            if (!changes || (changes && 'label' in changes)) {
                this.accountNameCache.delete(this.getAccountNameCacheKey(account.address));
            }
        }
    };

    private onContactChange = (contact: Partial<ContactModel>) => {
        // remove the cache if contact is added/removed/updated
        if (contact?.address) {
            this.accountNameCache.delete(this.getAccountNameCacheKey(contact.address, contact.destinationTag));
        }
    };

    private getAccountNameCacheKey = (address: string, tag?: number | string) => {
        return `${address}${tag ?? ''}`;
    };

    private resolveAccountName = async (address: string, tag?: number, internal = false) => {
        const sources: {
            source: () => any;
            mapper: (result: any) => { name?: string; source?: string; kycApproved?: boolean };
        }[] = [
            {
                source: ContactRepository.findOne.bind(null, { address, destinationTag: `${tag ?? ''}` }),
                mapper: (contact: ReturnType<typeof ContactRepository.findOne>) => ({
                    name: contact?.name,
                    source: 'contacts',
                }),
            },
            {
                source: AccountRepository.findOne.bind(null, { address }),
                mapper: (account: ReturnType<typeof AccountRepository.findOne>) => ({
                    name: account?.label,
                    source: 'accounts',
                }),
            },
        ];

        // if we are not only for local result then fetch from backend also
        if (!internal) {
            sources.push({
                source: BackendService.getAddressInfo.bind(null, address),
                mapper: (res: XamanBackend.AccountInfoResponse) => ({
                    name: res?.name ?? undefined,
                    source: res?.source?.replace('internal:', '').replace('.com', ''),
                    kycApproved: res?.kycApproved,
                    blocked: res?.blocked,
                }),
            });
        }

        for (const { source, mapper } of sources) {
            try {
                const result = await source();
                if (result) return mapper(result);
            } catch (error) {
                this.logger.warn(`Error fetching data from source: ${address}`, error);
            }
        }

        // not found
        return {
            address,
            tag,
        };
    };

    public clearCache = async () => {
        // clear resolver cache
        this.accountNameCache.clear();

        // get all currencies and set their last update to lowest
        const currencies = CurrencyRepository.findAll();
        return Promise.all(
            currencies.map(async (currency) => {
                await CurrencyRepository.update({
                    id: currency.id,
                    name: '',
                    issuerAvatarUrl: '',
                    avatarUrl: '',
                    issuerName: '',
                    xappIdentifier: '',
                    shortlist: false,
                    updatedAt: new Date(0),
                });
            }),
        );
    };

    public getAccountName = async (
        address: string,
        tag?: number,
        internal = false,
    ): Promise<AccountNameResolveType> => {
        const key = `${address}${tag ?? ''}`;

        const cachedValue = this.accountNameCache.get(key);
        if (cachedValue) {
            return cachedValue;
        }

        const resultPromise = (async () => {
            const result = await this.resolveAccountName(address, tag, internal);
            this.accountNameCache.set(key, { ...result, address, tag });
            return { ...result, address, tag };
        })();

        this.accountNameCache.set(key, resultPromise); // save the promise itself for subsequent calls

        return resultPromise;
    };

    public getAccountAdvisoryInfo = async (address: string): Promise<AccountAdvisoryResolveType> => {
        // Get account advisory from backend
        const accountAdvisory = await BackendService.getAccountAdvisory(address);
        if (!accountAdvisory.danger) {
            throw new Error('Account advisory risk level not found.');
        }

        // fetch account info from ledger
        const accountInfo = await LedgerService.getAccountInfo(address);

        if ('error' in accountInfo) {
            // account doesn't exist in the ledger, no need to check further
            if (accountInfo.error === 'actNotFound') {
                return {
                    exist: false,
                    danger: accountAdvisory.danger,
                };
            }
            throw new Error('Error fetching account info.');
        }

        const { account_data: accountData, account_flags: accountFlags } = accountInfo;

        return {
            exist: true,
            danger: accountAdvisory.danger,
            possibleExchange: Advisory.checkPossibleExchange(accountData),
            blackHole: Advisory.checkBlackHoleAccount(accountData, accountFlags),
            disallowIncomingXRP: Advisory.checkDisallowIncomingXRP(accountFlags),
            requireDestinationTag: await Advisory.checkRequireDestinationTag(address, accountAdvisory, accountFlags),
        };
    };

    public getPayIdInfo = async (payId: string): Promise<PayIDInfo | undefined> => {
        try {
            const res = await BackendService.lookup(payId);
            const match = res?.matches?.[0];
            return match ? { account: match.account, tag: match.tag } : undefined;
        } catch {
            return undefined;
        }
    };
}

/* Export  ==================================================================== */
export default new ResolverService();
