import { WebLinks } from '@common/constants/endpoints';

import { GetTransactionLink, GetAccountLink } from '../explorer';

jest.mock('@services/NetworkService');

describe('Utils.Explorer', () => {
    it('should return right transaction link', () => {
        expect(GetTransactionLink('CTID')).toEqual(`${WebLinks.ExplorerProxy}/0/CTID`);
    });

    it('should return right account link', () => {
        expect(GetAccountLink('ACCOUNT')).toEqual(`${WebLinks.ExplorerProxy}/0/ACCOUNT`);
    });
});
