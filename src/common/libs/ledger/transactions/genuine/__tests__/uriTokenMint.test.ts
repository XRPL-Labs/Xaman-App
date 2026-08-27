/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';
import { AssetTypes } from '@common/libs/ledger/factory/types';

import { URITokenMint, URITokenMintInfo } from '../URITokenMint';

import uriTokenMintTemplate from './fixtures/URITokenMintTx.json';

jest.mock('@services/NetworkService');

describe('URITokenMint tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new URITokenMint();
            expect(instance.TransactionType).toBe('URITokenMint');
            expect(instance.Type).toBe('URITokenMint');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = uriTokenMintTemplate;
            const instance = new URITokenMint(tx, meta);

            expect(instance.URITokenID).toBe('C84F707D006E99BEA1BC0A05C9123C8FFE3B40C45625C20DA24059DE09C09C9F');
            expect(instance.URI).toBe('697066733A2F2F434944');
            expect(instance.Digest).toBe('697066733A2F2F434944697066733A2F2F434944697066733A2F2F434944');
            expect(instance.Destination).toBe('rDestinationxxxxxxxxxxxxxxxxxxxxxx');
            expect(instance.Amount).toStrictEqual({
                value: '1',
                currency: 'XRP',
            });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = uriTokenMintTemplate;
        const Mixed = MutationsMixin(URITokenMint);
        const instance = new Mixed(tx, meta);
        const info = new URITokenMintInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The minter of this token has set the initial selling price to 1 XRP.${'\n'}This token can only be purchased by rDestinationxxxxxxxxxxxxxxxxxxxxxx${'\n'}The token has a digest: 697066733A2F2F434944697066733A2F2F434944697066733A2F2F434944${'\n'}The URI for this token is 697066733A2F2F434944`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            const minter = tx.Account;
            const destination = tx.Destination;

            const remitInstance = (extraMeta: Record<string, unknown> = {}) => {
                const remitTx = { ...tx };
                delete remitTx.Amount;
                return new Mixed(remitTx, { ...meta, ParentRemitID: tx.hash, ...extraMeta });
            };

            it('returns mint when the viewer is unknown', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.mintURIToken'));
            });

            it('returns mint when the minter created a sell offer', () => {
                expect(new URITokenMintInfo(instance, { address: minter } as any).getEventsLabel()).toEqual(
                    Localize.t('events.mintURIToken'),
                );
            });

            it('returns offered to you when Destination can buy the mint offer', () => {
                expect(new URITokenMintInfo(instance, { address: destination } as any).getEventsLabel()).toEqual(
                    Localize.t('events.uriTokenOfferedToYou'),
                );
            });

            it('returns sent when the minter delivered without Amount (Remit)', () => {
                expect(new URITokenMintInfo(remitInstance(), { address: minter } as any).getEventsLabel()).toEqual(
                    Localize.t('events.uriTokenSent'),
                );
            });

            it('returns sent to you when Destination received a Remit delivery', () => {
                expect(new URITokenMintInfo(remitInstance(), { address: destination } as any).getEventsLabel()).toEqual(
                    Localize.t('events.uriTokenSentToYou'),
                );
            });

            it('returns sent not to you when the minter remits to self', () => {
                const selfTx = { ...tx, Destination: minter };
                delete selfTx.Amount;
                const selfMint = new Mixed(selfTx, { ...meta, ParentRemitID: tx.hash });
                expect(new URITokenMintInfo(selfMint, { address: minter } as any).getEventsLabel()).toEqual(
                    Localize.t('events.uriTokenSent'),
                );
            });

            it('returns sent to you for a Remit output even if Amount is present', () => {
                const remit = new Mixed(tx, { ...meta, ParentRemitID: tx.hash });
                expect(new URITokenMintInfo(remit, { address: destination } as any).getEventsLabel()).toEqual(
                    Localize.t('events.uriTokenSentToYou'),
                );
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', tag: undefined },
                    end: { address: 'rDestinationxxxxxxxxxxxxxxxxxxxxxx', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                    factor: [
                        {
                            action: 'DEC',
                            currency: 'XRP',
                            effect: 'POTENTIAL_EFFECT',
                            value: '1',
                        },
                    ],
                });
            });
        });

        describe('getAssetDetails()', () => {
            it('should return the expected asset details', () => {
                expect(info.getAssetDetails()).toStrictEqual([
                    {
                        owner: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
                        type: AssetTypes.URIToken,
                        uriTokenId: 'C84F707D006E99BEA1BC0A05C9123C8FFE3B40C45625C20DA24059DE09C09C9F',
                    },
                ]);
            });
        });
    });

    describe('Validation', () => {});
});
