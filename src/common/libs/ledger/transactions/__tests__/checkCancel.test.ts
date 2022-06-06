/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import CheckCancel from '../checkCancel';
import CheckCreate from '../checkCreate';

import checkCancelTemplates from './templates/CheckCancelTx.json';
import checkCreateTemplate from './templates/CheckCreateTx.json';

describe('CheckCancel tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new CheckCancel();
        expect(instance.TransactionType).toBe('CheckCancel');
        expect(instance.Type).toBe('CheckCancel');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const { tx, meta } = checkCancelTemplates;
        const instance = new CheckCancel(tx, meta);

        expect(instance.CheckID).toBe('6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B');
    });

    it('Should set check object', () => {
        // @ts-ignore
        const { tx, meta } = checkCancelTemplates;
        const instance = new CheckCancel(tx, meta);

        const checkCreate = new CheckCreate(checkCreateTemplate.tx);

        instance.Check = checkCreate;

        expect(instance.Check).toBeDefined();
        expect(instance.isExpired).toBe(true);
    });
});
