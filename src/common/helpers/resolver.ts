import { memoize, isEmpty } from 'lodash';

import { ContactRepository, AccountRepository } from '@store/repositories';

import { BackendService } from '@services';

const getAccountInfo = memoize((address: string) => {
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
                return resolve({});
            })
            .catch(() => {
                return resolve({});
            });
    });
});

export { getAccountInfo };
