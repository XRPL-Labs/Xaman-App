import BigNumber from 'bignumber.js';

/* Class ==================================================================== */
class Amount {
    amount: BigNumber;

    constructor(amount: string | number, drops = true) {
        // validate

        if (typeof amount === 'string' && !drops) {
            if (!amount.match(/^[+-]?\d+(?:[.]*\d*(?:[eE][+-]?\d+)?)?$/)) {
                throw new Error(`invalid value '${amount}', should be a number`);
            } else if (amount === '.') {
                throw new Error(`invalid value '${amount}',  should be a BigNumber or string-encoded number.`);
            }
        }

        // Converting to BigNumber and then back to string should remove any
        // decimal point followed by zeros, e.g. '1.00'.
        // Important: specify to fixed to avoid exponential notation, e.g. '1e-7'.
        const newAmount = new BigNumber(amount).toFixed();

        if (drops) {
            // drops are only whole units
            if (newAmount.includes('.')) {
                throw new Error(`value '${amount}' has too many decimal places.`);
            }
        }

        this.amount = new BigNumber(newAmount);
    }

    dropsToNative(toNumber = false): any {
        const xrp = this.amount.dividedBy(1000000.0);

        if (toNumber) {
            return xrp.toNumber();
        }

        return xrp.toString(10);
    }

    nativeToDrops(toNumber = false): any {
        const drops = this.amount.times(1000000.0).decimalPlaces(0);

        if (toNumber) {
            return drops.toNumber();
        }

        return drops.toString(10);
    }

    withTransferRate(transferRate: number, toNumber = false): any {
        const withRate = this.amount.plus(this.amount.multipliedBy(transferRate).dividedBy(100));

        if (toNumber) {
            return withRate.toNumber();
        }

        return withRate.toString(10);
    }

    toString(toFixed = true): string {
        if (toFixed) {
            return this.amount.toFixed();
        }
        return this.amount.toString();
    }

    toNumber(): number {
        return this.amount.toNumber();
    }
}

/* Export ==================================================================== */
export default Amount;
