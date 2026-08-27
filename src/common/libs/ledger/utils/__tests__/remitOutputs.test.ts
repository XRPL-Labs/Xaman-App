import Localize from '@locale';

import { Remit } from '@common/libs/ledger/transactions';
import { URITokenMintInfo } from '../../transactions/genuine/URITokenMint';
import { buildRemitOutputTransactions } from '../remitOutputs';

jest.mock('@services/NetworkService', () => ({
    network: {},
    getNativeAsset: jest.fn().mockReturnValue('XAH'),
    getNetworkDefinitions: jest.fn().mockReturnValue({}),
    getNetworkId: jest.fn().mockReturnValue(21337),
}));

const ACCOUNT = 'r33z9wHwjpmw8ycjtgJwh38KDC3Fujoauz';
const DESTINATION = 'rQQQrUdN1cLdNmxH4dHfKgmX5P4kf3ZrM';
const HASH = '3298D4D24122DF6BFEAB36C05794D1758075F6E109BA45423246BA1F63CFEC1A';
const URI =
    '697066733A2F2F62616679626569636F78746A7A65747374366263676E6D71676E757A3761666E757A736169786A757265626F6233677366337566707A726F3472612F3030303032332E6A736F6E';
const TOKEN_ID = 'A6C099A7CB8E80244BB8999BDE1732531EA33413D08066438735D14613B4E2CF';

describe('buildRemitOutputTransactions', () => {
    it('returns empty when not a Remit', () => {
        expect(buildRemitOutputTransactions({ Type: 'Payment' } as any)).toEqual([]);
    });

    it('builds a URITokenMint row from MintURIToken', () => {
        const remit = new Remit(
            {
                TransactionType: 'Remit',
                Account: ACCOUNT,
                Destination: DESTINATION,
                MintURIToken: { URI },
                hash: HASH,
            } as any,
            {
                AffectedNodes: [
                    {
                        CreatedNode: {
                            LedgerEntryType: 'URIToken',
                            LedgerIndex: TOKEN_ID,
                            NewFields: { URI, Owner: DESTINATION, Issuer: ACCOUNT },
                        },
                    },
                ],
            } as any,
        );

        const outputs = buildRemitOutputTransactions(remit);
        expect(outputs).toHaveLength(1);
        expect(outputs[0].TransactionType).toBe('URITokenMint');
        expect((outputs[0] as any).URI).toBe(URI);
        expect((outputs[0] as any).Destination).toBe(DESTINATION);
        expect((outputs[0] as any).URITokenID).toBe(TOKEN_ID);
        expect((outputs[0] as any).Amount).toBeUndefined();
        expect((outputs[0] as any).MetaData.ParentRemitID).toBe(HASH);
        expect(
            new URITokenMintInfo(outputs[0] as any, { address: DESTINATION } as any).getEventsLabel(),
        ).toEqual(Localize.t('events.uriTokenSentToYou'));
        expect(
            new URITokenMintInfo(outputs[0] as any, { address: ACCOUNT } as any).getEventsLabel(),
        ).toEqual(Localize.t('events.uriTokenSent'));
    });

    it('builds Payment rows from Amounts', () => {
        const remit = new Remit({
            TransactionType: 'Remit',
            Account: ACCOUNT,
            Destination: DESTINATION,
            Amounts: [{ AmountEntry: { Amount: '200000' } }],
            hash: HASH,
        } as any);

        const outputs = buildRemitOutputTransactions(remit);
        expect(outputs).toHaveLength(1);
        expect(outputs[0].TransactionType).toBe('Payment');
        expect((outputs[0] as any).Destination).toBe(DESTINATION);
        expect((outputs[0] as any).Amount.value).toBe('0.2');
        expect((outputs[0] as any).Amount.currency).toBe('XAH');
    });

    it('builds URITokenMint rows from URITokenIDs', () => {
        const remit = new Remit({
            TransactionType: 'Remit',
            Account: ACCOUNT,
            Destination: DESTINATION,
            URITokenIDs: [TOKEN_ID],
            hash: HASH,
        } as any);

        const outputs = buildRemitOutputTransactions(remit);
        expect(outputs).toHaveLength(1);
        expect(outputs[0].TransactionType).toBe('URITokenMint');
        expect((outputs[0] as any).URITokenID).toBe(TOKEN_ID);
    });

    it('copies the parent Remit ledger onto outputs so CTID does not throw', () => {
        const remit = new Remit(
            {
                TransactionType: 'Remit',
                Account: ACCOUNT,
                Destination: DESTINATION,
                MintURIToken: { URI },
                hash: HASH,
                ledger_index: 18904437,
                inLedger: 18904437,
                date: 817816051,
                ctid: 'C120757500C25359',
            } as any,
            {
                TransactionIndex: 194,
                TransactionResult: 'tesSUCCESS',
                AffectedNodes: [
                    {
                        CreatedNode: {
                            LedgerEntryType: 'URIToken',
                            LedgerIndex: TOKEN_ID,
                            NewFields: { URI, Owner: DESTINATION, Issuer: ACCOUNT },
                        },
                    },
                ],
            } as any,
        );

        const outputs = buildRemitOutputTransactions(remit);
        expect(outputs).toHaveLength(1);
        expect(outputs[0].LedgerIndex).toBe(18904437);
        expect(outputs[0].TransactionIndex).toBe(194);
        expect(() => outputs[0].CTID).not.toThrow();
        expect(outputs[0].CTID).toBe('C120757500C25359');
        expect((outputs[0] as any).MetaData.ParentRemitID).toBe(HASH);
    });
});
