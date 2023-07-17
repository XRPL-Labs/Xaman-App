import BigNumber from 'bignumber.js';

import LedgerService from '@services/LedgerService';

import { AccountModel } from '@store/models';

/**
 * calculate account available balance base on base/owner reserve
 */
const CalculateAvailableBalance = (account: AccountModel, allowNegative = false): number => {
    // account is not activated
    if (account.balance === 0) {
        return 0;
    }

    const { BaseReserve, OwnerReserve } = LedgerService.getNetworkReserve();

    // calculate the spendable amount
    const spendable = account.balance - BaseReserve - account.ownerCount * OwnerReserve;

    const availableBalance = new BigNumber(spendable).decimalPlaces(8).toNumber();

    if (availableBalance < 0 && !allowNegative) {
        return 0;
    }

    return availableBalance;
};

/**
 * get account total reserve in native currency
 */
const CalculateTotalReserve = (account: AccountModel): number => {
    // account is not activated
    if (account.balance === 0) {
        return 0;
    }

    const { BaseReserve, OwnerReserve } = LedgerService.getNetworkReserve();
    // calculate the spendable amount
    return account.ownerCount * OwnerReserve + BaseReserve;
};

export { CalculateAvailableBalance, CalculateTotalReserve };
