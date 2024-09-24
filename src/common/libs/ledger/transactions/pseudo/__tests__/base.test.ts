import BasePseudoTransaction from '../base';

import BasePseudoTxTemplate from './fixtures/BasePseudoTx.json';

jest.mock('@services/NetworkService');

describe('BasePseudoTransaction', () => {
    it('JsonForSigning should remove the TransactionType field', () => {
        const { tx, meta }: any = BasePseudoTxTemplate;

        const instance = new BasePseudoTransaction(tx, meta);

        expect(instance.TransactionType).toBe('SignIn');
        expect(instance.JsonForSigning).toStrictEqual({
            Memos: [
                {
                    Memo: {
                        MemoData: '5852502054697020426F74',
                        MemoType: '587270546970426F744E6F7465',
                    },
                },
            ],
        });
    });
});
