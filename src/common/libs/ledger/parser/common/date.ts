// TODO: validate the date and show error in type errors

class LedgerDateParser {
    date: number | string;

    constructor(date: number | string) {
        this.date = date;
    }

    /**
     * @return {Number} ms since unix epoch
     */
    static ledgerToUnixTimestamp(ledgerTimestamp: number): number {
        return (ledgerTimestamp + 0x386d4380) * 1000;
    }

    /**
     * @param {Number|Date} timestamp (ms since unix epoch)
     * @return {Number} seconds since ripple epoch (1/1/2000 GMT)
     */
    static unixToLedgerTimestamp(timestamp: number): number {
        return Math.round(timestamp / 1000) - 0x386d4380;
    }

    /**
     * @return {string} ISO8601 Date
     */
    toISO8601(): string {
        if (typeof this.date !== 'number') {
            throw new Error('date value should be valid ledger timestamp!');
        }
        return new Date(LedgerDateParser.ledgerToUnixTimestamp(this.date)).toISOString();
    }

    /**
     * @return {number} seconds since ripple epoch (1/1/2000 GMT)
     */
    toLedgerTime(): number {
        if (typeof this.date !== 'string') {
            throw new Error('date value should be valid date-time string!');
        }
        return LedgerDateParser.unixToLedgerTimestamp(Date.parse(this.date));
    }
}

export default LedgerDateParser;
