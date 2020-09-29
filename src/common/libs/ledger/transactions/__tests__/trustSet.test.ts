/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import TrustSet from '../trustSet';

import txTemplates from './templates/trustSetTx.json';

describe('TrustSet tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new TrustSet();
        expect(instance.Type).toBe('TrustSet');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const instance = new TrustSet(txTemplates);

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
