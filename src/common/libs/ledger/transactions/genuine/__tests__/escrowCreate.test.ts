/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { EscrowCreate, EscrowCreateInfo } from '../EscrowCreate';
import escrowCreateTemplate from './fixtures/EscrowCreateTx.json';

jest.mock('@services/NetworkService');

describe('EscrowCreate', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new EscrowCreate();
            expect(instance.TransactionType).toBe('EscrowCreate');
            expect(instance.Type).toBe('EscrowCreate');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = escrowCreateTemplate;
            const instance = new EscrowCreate(tx, meta);

            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.DestinationTag).toEqual(23480);

            expect(instance.Amount).toStrictEqual({
                currency: 'XRP',
                value: '0.01',
            });

            expect(instance.Condition).toBe(
                'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
            );

            expect(instance.CancelAfter).toBe('2016-11-23T23:12:38.000Z');
            expect(instance.FinishAfter).toBe('2016-11-22T23:12:38.000Z');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = escrowCreateTemplate;
        const Mixed = MutationsMixin(EscrowCreate);
        const instance = new Mixed(tx, meta);
        const info = new EscrowCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The escrow is from rrrrrrrrrrrrrrrrrrrrrholvtp to rrrrrrrrrrrrrrrrrrrrbzbvji${'\n'}The escrow has a destination tag: 23480${'\n'}It escrowed 0.01 XRP${'\n'}It can be cancelled after Thursday, November 24, 2016 12:12 AM${'\n'}It can be finished after Wednesday, November 23, 2016 12:12 AM`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });
        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createEscrow'));
            });
        });
    });

    describe('Validation', () => {});
});
