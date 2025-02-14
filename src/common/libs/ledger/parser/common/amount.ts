import BigNumber from 'bignumber.js';

/* Class ==================================================================== */
class AmountParser {
    amount: BigNumber;

    constructor(amount: string | number, drops = true) {
        // validate

        if (typeof amount === 'string' && !drops && amount !== '') {
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

    dropsToNative() {
        this.amount = this.amount.dividedBy(1000000.0);

        return this;
    }

    nativeToDrops() {
        this.amount = this.amount.times(1000000.0).decimalPlaces(0);

        return this;
    }

    withTransferRate(transferRate: number) {
        this.amount = this.amount.plus(this.amount.multipliedBy(transferRate).dividedBy(100));

        return this;
    }

    toString(): string {
        return this.amount.toString(10);
    }

    toNumber(): number {
        return this.amount.toNumber();
    }

    toFixed(): string {
        return this.amount.toFixed();
    }
}

/* Export ==================================================================== */
export default AmountParser;
