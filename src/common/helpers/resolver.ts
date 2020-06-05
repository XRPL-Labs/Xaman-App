import { memoize, isEmpty, has, get, assign } from 'lodash';

import Flag from '@common/libs/ledger/parser/common/flag';

import AccountRepository from '@store/repositories/account';
import ContactRepository from '@store/repositories/contact';

import LedgerService from '@services/LedgerService';
import BackendService from '@services/BackendService';

export interface PayIDInfo {
    account: string;
    tag: string;
}
export interface AccountNameType {
    name: string;
    source: string;
}

export interface AccountInfoType {
    exist: boolean;
    risk: 'ERROR' | 'UNKNOWS' | 'PROBABLE' | 'HIGH_PROBABILITY' | 'CONFIRMED';
    requireDestinationTag: boolean;
}

const getAccountName = memoize(
    (address: string, tag?: number, internal?: boolean): Promise<AccountNameType> => {
        return new Promise((resolve) => {
            if (!address) {
                return resolve({
                    name: '',
                    source: '',
                });
            }

            // check address  book
            try {
                let filter = { address };
                if (tag) {
                    filter = Object.assign(filter, { destinationTag: tag });
                }
                const contact = ContactRepository.findOne(filter);
                if (!isEmpty(contact)) {
                    return resolve({
                        name: contact.name,
                        source: 'internal:contacts',
                    });
                }
            } catch {
                // ignore
            }

            try {
                // check in accounts list
                const account = AccountRepository.findOne({ address });
                if (!isEmpty(account)) {
                    return resolve({
                        name: account.label,
                        source: 'internal:accounts',
                    });
                }
            } catch {
                // ignore
            }

            // only lookup for local result
            if (internal) {
                return resolve({
                    name: '',
                    source: '',
                });
            }

            // check the backend
            return BackendService.getAddressInfo(address)
                .then((res: any) => {
                    if (!isEmpty(res)) {
                        return resolve({
                            name: res.name,
                            source: res.source,
                        });
                    }
                    return resolve({
                        name: '',
                        source: '',
                    });
                })
                .catch(() => {
                    return resolve({
                        name: '',
                        source: '',
                    });
                });
        });
    },
    (address: string, tag: number) => `${address}${tag}`,
);

const getAccountInfo = (address: string): Promise<AccountInfoType> => {
    /* eslint-disable-next-line  */
    return new Promise(async (resolve, reject) => {
        if (!address) {
            return reject();
        }

        const info = {
            exist: true,
            risk: 'UNKNOWS',
            requireDestinationTag: false,
        } as AccountInfoType;

        try {
            const accountInfo = await LedgerService.getAccountInfo(address);

            // account doesn't exist no need to check account risk
            if (has(accountInfo, 'error')) {
                if (get(accountInfo, 'error') === 'actNotFound') {
                    return resolve(assign(info, { exist: false }));
                }
                return reject();
            }

            const accountRisk = await BackendService.getAccountRisk(address);

            if (has(accountRisk, 'danger')) {
                assign(info, { risk: accountRisk.danger });
            } else {
                return reject();
            }

            // check if destination requires the destination tag
            if (has(accountInfo, ['account_data', 'Flags'])) {
                const { account_data } = accountInfo;
                const accountFlags = new Flag('Account', account_data.Flags).parse();

                // flag is set
                if (accountFlags.requireDestinationTag) {
                    assign(info, { requireDestinationTag: true });
                } else {
                    const accountTXS = await LedgerService.getTransactions(address, undefined, 200);
                    if (
                        typeof accountTXS.transactions !== 'undefined' &&
                        accountTXS.transactions &&
                        accountTXS.transactions.length > 0
                    ) {
                        const incomingTXS = accountTXS.transactions.filter((tx) => {
                            return tx.tx.Destination === address;
                        });

                        const incomingTxCountWithTag = incomingTXS.filter((tx) => {
                            return (
                                typeof tx.tx.TransactionType === 'string' &&
                                typeof tx.tx.DestinationTag !== 'undefined' &&
                                tx.tx.DestinationTag !== 0
                            );
                        }).length;

                        const senders = accountTXS.transactions.map((tx) => {
                            return tx.tx.Account || '';
                        });

                        const uniqueSenders = senders.filter((elem, pos) => {
                            return senders.indexOf(elem) === pos;
                        }).length;

                        const percentageTag = (incomingTxCountWithTag / incomingTXS.length) * 100;

                        if (uniqueSenders >= 10 && percentageTag > 50) {
                            assign(info, { requireDestinationTag: true });
                        }
                    }
                }
            }

            return resolve(info);
        } catch {
            return reject();
        }
    });
};

const getPayIdInfo = (payId: string): Promise<PayIDInfo> => {
    return new Promise((resolve) => {
        BackendService.lookup(payId)
            .then((res: any) => {
                if (!isEmpty(res) && res.error !== true) {
                    if (!isEmpty(res.matches)) {
                        const match = res.matches[0];
                        return resolve({
                            account: match.account,
                            tag: match.tag,
                        });
                    }
                }
                return resolve(undefined);
            })
            .catch(() => {
                return resolve(undefined);
            });
    });
};

export { getAccountName, getAccountInfo, getPayIdInfo };
