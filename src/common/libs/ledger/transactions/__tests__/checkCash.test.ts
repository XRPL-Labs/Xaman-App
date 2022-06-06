/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import CheckCash from '../checkCash';
import CheckCreate from '../checkCreate';

import checkCashTemplates from './templates/CheckCashTx.json';
import checkCreateTemplate from './templates/CheckCreateTx.json';

describe('CheckCash tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new CheckCash();
        expect(instance.TransactionType).toBe('CheckCash');
        expect(instance.Type).toBe('CheckCash');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const { tx, meta } = checkCashTemplates;
        const instance = new CheckCash(tx, meta);

        expect(instance.CheckID).toBe('6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B');

        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '100',
        });
    });

    it('Should set check object', () => {
        // @ts-ignore
        const { tx, meta } = checkCashTemplates;
        const instance = new CheckCash(tx, meta);

        const checkCreate = new CheckCreate(checkCreateTemplate.tx);

        instance.Check = checkCreate;

        expect(instance.Check).toBeDefined();
        expect(instance.isExpired).toBe(true);
    });

    it('Should set/get fields', () => {
        const instance = new CheckCash();

        // @ts-ignore
        instance.Amount = '100';
        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '100',
        });

        // @ts-ignore
        instance.Amount = {
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        };
        expect(instance.Amount).toStrictEqual({
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        });

        // @ts-ignore
        instance.DeliverMin = '100';
        expect(instance.DeliverMin).toStrictEqual({
            currency: 'XRP',
            value: '100',
        });

        // @ts-ignore
        instance.DeliverMin = {
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        };
        expect(instance.DeliverMin).toStrictEqual({
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        });
    });
});
