/**
 * AccountService
 * Subscribe to account changes and transactions
 * This is the service we use for update accounts real time details and listen for ledger transactions
 */

import EventEmitter from 'events';
import { map, forEach, get, keys } from 'lodash';

import { CurrencyModel, TrustLineModel } from '@store/models';
import { AccountRepository, AmmPairRepository, CurrencyRepository } from '@store/repositories';
import { RewardInformation } from '@store/models/objects/accountDetails';

import Meta from '@common/libs/ledger/parser/meta';
import { AmountParser } from '@common/libs/ledger/parser/common';

import NetworkService from '@services/NetworkService';
import LoggerService, { LoggerInstance } from '@services/LoggerService';
import LedgerService from '@services/LedgerService';

import { AccountTypes } from '@store/types';

import {
    SubscribeRequest,
    SubscribeResponse,
    TransactionStream,
    UnsubscribeRequest,
    UnsubscribeResponse,
} from '@common/libs/ledger/types/methods';
import BigNumber from 'bignumber.js';

/* Events  ==================================================================== */
export type AccountServiceEvent = {
    transaction: (transaction: TransactionStream, effectedAccounts: Array<string>) => void;
};

declare interface AccountService {
    on<U extends keyof AccountServiceEvent>(event: U, listener: AccountServiceEvent[U]): this;
    off<U extends keyof AccountServiceEvent>(event: U, listener: AccountServiceEvent[U]): this;
    emit<U extends keyof AccountServiceEvent>(event: U, ...args: Parameters<AccountServiceEvent[U]>): boolean;
}
/* Service  ==================================================================== */
class AccountService extends EventEmitter {
    private accounts: string[];
    private transactionListener: any;

    private logger: LoggerInstance;

    constructor() {
        super();

        this.accounts = [];
        this.logger = LoggerService.createLogger('Account');
    }

    initialize = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            try {
                // load accounts
                this.loadAccounts();

                // add listeners for account changes
                AccountRepository.on('accountCreate', this.onAccountsChange);
                AccountRepository.on('accountRemove', this.onAccountsChange);

                // on network service connect
                NetworkService.on('connect', this.onNetworkConnect);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Update the details when connect to the network
     */
    onNetworkConnect = () => {
        // update account details
        this.updateAccountsDetails();
        // subscribe accounts for transactions stream
        this.subscribe();
        // register on transaction event handler
        this.setTransactionListener();
    };

    /**
     * Set transaction listener if not set
     */
    setTransactionListener = () => {
        // if already any listener remove it
        if (this.transactionListener) {
            NetworkService.offEvent('transaction', this.transactionHandler);
        }
        // create the new listener
        this.transactionListener = NetworkService.onEvent('transaction', this.transactionHandler);
    };

    /**
     * Handle stream transactions on subscribed accounts
     */
    transactionHandler = (tx: TransactionStream) => {
        const { transaction, meta } = tx;

        if (typeof transaction === 'object' && typeof meta === 'object') {
            this.logger.debug(`Transaction received: ${get(transaction, 'hash', 'NO_HASH')}`);

            // get effected accounts
            const balanceChangesAccounts = keys(new Meta(meta).parseBalanceChanges());
            const ownerCountChangesAccounts = map(new Meta(meta).parseOwnerCountChanges(), 'address');

            const effectedAccounts = [...new Set([...balanceChangesAccounts, ...ownerCountChangesAccounts])];

            // update account details
            this.updateAccountsDetails(effectedAccounts);

            // emit onTransaction event
            this.emit('transaction', transaction, effectedAccounts);
        }
    };

    /**
     * Load accounts from data store
     */
    loadAccounts = () => {
        // fetch accounts from store
        const accounts = AccountRepository.getAccounts();

        // no account is present in the app
        if (accounts.length === 0) {
            this.accounts = [];
            return;
        }

        // log the existent accounts in the session log
        this.logger.debug(
            `Presented accounts: ${accounts.reduce(
                (account, item) =>
                    `${account}\n${item.address}-${item.accessLevel} ${
                        item.flags?.disableMasterKey ? '[MasterDisabled]' : ''
                    } ${item.type !== AccountTypes.Regular ? `[${item.type}]` : ''}`,
                '',
            )}`,
        );

        this.accounts = accounts.flatMap((account) => account.address);
    };

    /**
     * Update account info, contain balance etc ...
     */
    updateAccountInfo = async (account: string) => {
        // fetch account info from ledger
        const accountInfo = await LedgerService.getAccountInfo(account);

        if (!accountInfo) {
            this.logger.warn(`Fetch account info [${account}]: got empty response`);
        }

        // if there is any error in the response return and ignore fetching the account lines
        if ('error' in accountInfo) {
            // account not found reset account to default state
            if (get(accountInfo, 'error') === 'actNotFound') {
                // reset account details to default
                await AccountRepository.updateDetails(account, {
                    id: `${account}.${NetworkService.getNetworkId()}`,
                    network: NetworkService.getNetwork(),
                    ownerCount: 0,
                    sequence: 0,
                    balance: 0,
                    flagsString: JSON.stringify({}),
                    regularKey: '',
                    domain: '',
                    emailHash: '',
                    messageKey: '',
                    importSequence: 0,
                    reward: {} as any,
                    lines: [] as any,
                });
            }

            // log the error and return
            this.logger.warn(`Fetch account info [${account}]:`, accountInfo?.error);
            return;
        }

        // fetch the normalized account lines
        const normalizedAccountLines = await this.getNormalizedAccountLines(account);

        // if account FOUND and no error
        const { account_data, account_flags } = accountInfo;

        // update account info
        await AccountRepository.updateDetails(account, {
            id: `${account}.${NetworkService.getNetworkId()}`,
            network: NetworkService.getNetwork(),
            ownerCount: account_data?.OwnerCount ?? 0,
            sequence: account_data?.Sequence ?? 0,
            balance: new AmountParser(account_data?.Balance).dropsToNative().toNumber(),
            flagsString: JSON.stringify(account_flags),
            regularKey: account_data?.RegularKey ?? '',
            domain: account_data?.Domain ?? '',
            emailHash: account_data?.EmailHash ?? '',
            messageKey: account_data?.MessageKey ?? '',
            lines: normalizedAccountLines as unknown as Realm.Results<TrustLineModel>,
            accountIndex: account_data?.AccountIndex,
            reward: {
                rewardAccumulator: account_data?.RewardAccumulator,
                rewardLgrFirst: account_data?.RewardLgrFirst,
                rewardLgrLast: account_data?.RewardLgrLast,
                rewardTime: account_data?.RewardTime,
            } as unknown as RewardInformation,
        });
    };

    /**
     * Get normalized account lines
     */
    getNormalizedAccountLines = async (account: string): Promise<Partial<TrustLineModel>[]> => {
        const [accountLines, accountObligations] = await Promise.all([
            LedgerService.getFilteredAccountLines(account),
            LedgerService.getAccountObligations(account),
        ]);

        const combinedLines = [...accountLines, ...accountObligations];

        const normalizedList = await Promise.all(
            combinedLines.map(async (line) => {
                const currency = await CurrencyRepository.upsert({
                    id: `${line.account}.${line.currency}`,
                    issuer: line.account,
                    currencyCode: line.currency,
                });

                let { balance } = line;
                // in case of IOU Escrow we deduct the locked balance from actual balance
                if (line.locked_balance) {
                    balance = new BigNumber(balance).minus(new BigNumber(line.locked_balance)).toString();
                }

                return {
                    id: `${account}.${currency.id}}`,
                    currency,
                    balance,
                    no_ripple: line.no_ripple ?? false,
                    no_ripple_peer: line.no_ripple_peer ?? false,
                    limit: line.limit,
                    limit_peer: line.limit_peer,
                    quality_in: line.quality_in ?? 0,
                    quality_out: line.quality_out ?? 0,
                    authorized: line.authorized ?? false,
                    peer_authorized: line.peer_authorized ?? false,
                    freeze: line.freeze ?? false,
                    obligation: line.obligation ?? false,
                };
            }),
        );

        return normalizedList;
    };

    updateAMMPairs = async (address: string) => {
        const account = AccountRepository.findOne({ address });

        if (!account || !account.lines || account.lines.length === 0) {
            return;
        }

        await Promise.all(
            account.lines
                .filter((line) => line.isLiquidityPoolToken())
                .map(async (line) => {
                    const ammInfoResp = await LedgerService.getAMMInfo(line.currency.issuer);

                    if ('error' in ammInfoResp) {
                        // just ignore
                        return;
                    }

                    const { amount, amount2, lp_token } = ammInfoResp.amm;

                    // check if we are setting correct amm pair
                    if (lp_token.currency !== line.currency.currencyCode || lp_token.issuer !== line.currency.issuer) {
                        throw new Error('Mismatch on lp_token data!');
                    }

                    const pairs: Array<string | CurrencyModel> = [];

                    for (const pair of [amount, amount2]) {
                        // native currency
                        if (typeof pair === 'string') {
                            pairs.push(NetworkService.getNativeAsset());
                        } else if (typeof pair === 'object') {
                            // IOU
                            pairs.push(
                                await CurrencyRepository.upsert({
                                    id: `${pair.issuer}.${pair.currency}`,
                                    issuer: pair.issuer,
                                    currencyCode: pair.currency,
                                }),
                            );
                        }
                    }

                    // no pair found ??
                    if (pairs.length === 0) {
                        return;
                    }

                    await AmmPairRepository.upsert({
                        id: lp_token.currency, // using lp token currency as pair identifier
                        pairs: pairs as unknown as Realm.List<string | CurrencyModel>,
                        line,
                    });
                }),
        );
    };

    /**
     * Update accounts details through socket request
     * this will contain account trustLines etc ...
     */
    updateAccountsDetails = (include?: string[]) => {
        forEach(this.accounts, async (account) => {
            // check if include present
            if (Array.isArray(include) && include.length > 0) {
                if (include.indexOf(account) === -1) return;
            }

            await this.updateAccountInfo(account).catch((error: Error) => {
                this.logger.error(`Update account info [${account}] `, error);
            });

            await this.updateAMMPairs(account).catch((error: Error) => {
                this.logger.error(`Update amm pairs [${account}] `, error);
            });
        });
    };

    /**
     * Watch for any account added or removed in store
     */
    onAccountsChange = () => {
        // unsubscribe from old list
        this.unsubscribe();

        // reload accounts
        this.loadAccounts();

        // subscribe again on new account list
        this.subscribe();

        // update accounts info
        this.updateAccountsDetails();
    };

    /**
     * Unsubscribe for streaming
     */
    unsubscribe() {
        this.logger.debug(`Unsubscribe to ${this.accounts.length} accounts`, this.accounts);

        NetworkService.send<UnsubscribeRequest, UnsubscribeResponse>({
            command: 'unsubscribe',
            accounts: this.accounts,
        }).catch((error: Error) => {
            this.logger.warn('Unable to Unsubscribe accounts', error);
        });
    }

    /**
     * Subscribe for streaming
     */
    subscribe() {
        this.logger.debug(`Subscribed to ${this.accounts.length} accounts`, this.accounts);

        NetworkService.send<SubscribeRequest, SubscribeResponse>({
            command: 'subscribe',
            accounts: this.accounts,
        }).catch((error: Error) => {
            this.logger.warn('Unable to Subscribe accounts', error);
        });
    }
}

export default new AccountService();
