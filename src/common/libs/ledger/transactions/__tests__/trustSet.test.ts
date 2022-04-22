/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import TrustSet from '../trustSet';

import trustSetTemplate from './templates/TrustSetTx.json';

describe('TrustSet tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new TrustSet();
        expect(instance.TransactionType).toBe('TrustSet');
        expect(instance.Type).toBe('TrustSet');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const { tx, meta } = trustSetTemplate;
        const instance = new TrustSet(tx, meta);

        expect(instance.Currency).toBe('USD');
        expect(instance.Issuer).toBe('rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc');
        expect(instance.Limit).toBe(100);
        expect(instance.QualityIn).toBe(1);
        expect(instance.QualityOut).toBe(1);
    });

    it('Should set/get fields', () => {
        const instance = new TrustSet();

        instance.Currency = 'USD';
        expect(instance.Currency).toBe('USD');

        instance.Issuer = 'rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc';
        expect(instance.Issuer).toBe('rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc');

        instance.Limit = 100;
        expect(instance.Limit).toBe(100);
    });
});
