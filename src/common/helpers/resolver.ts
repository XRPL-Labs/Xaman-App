import { memoize, isEmpty, has, get, assign } from 'lodash';

import Flag from '@common/libs/ledger/parser/common/flag';

import AccountRepository from '@store/repositories/account';
import ContactRepository from '@store/repositories/contact';

import { BackendService, LedgerService } from '@services';

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
    (address: string): Promise<AccountNameType> => {
        return new Promise(resolve => {
            // check address  book
            const contact = ContactRepository.findOne({ address });
            if (!isEmpty(contact)) {
                return resolve({
                    name: contact.name,
                    source: 'internal:contacts',
                });
            }

            // check in accounts list
            const account = AccountRepository.findOne({ address });
            if (!isEmpty(account)) {
                return resolve({
                    name: account.label,
                    source: 'internal:accounts',
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
);

const getAccountInfo = (address: string): Promise<AccountInfoType> => {
    /* eslint-disable-next-line  */
    return new Promise(async (resolve, reject) => {
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
                    const accountTXS = await LedgerService.getTransactions(address, undefined, 100);
                    if (
                        typeof accountTXS.transactions !== 'undefined' &&
                        accountTXS.transactions &&
                        accountTXS.transactions.length > 0
                    ) {
                        const incomingTxCountWithTag = accountTXS.transactions.filter((tx: any) => {
                            return (
                                typeof tx.tx.TransactionType === 'string' &&
                                tx.tx.TransactionType === 'Payment' &&
                                typeof tx.tx.DestinationTag !== 'undefined' &&
                                `${tx.tx.DestinationTag}` !== '0' &&
                                tx.tx.Destination === address
                            );
                        }).length;

                        const percent = (incomingTxCountWithTag * 100) / accountTXS.transactions.length;

                        if (percent > 65) {
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

export { getAccountName, getAccountInfo };
