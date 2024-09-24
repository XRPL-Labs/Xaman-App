// TODO: validate the date and show error in type errors

class LedgerDate {
    date: number | string;

    constructor(date: any) {
        this.date = date;
    }

    /**
     * @return {Number} ms since unix epoch
     */
    static ledgerToUnixTimestamp(rpepoch: number): number {
        return (rpepoch + 0x386d4380) * 1000;
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
        // @ts-ignore
        return new Date(LedgerDate.ledgerToUnixTimestamp(this.date)).toISOString();
    }

    /**
     * @return {number} seconds since ripple epoch (1/1/2000 GMT)
     */
    toLedgerTime(): number {
        // @ts-ignore
        return LedgerDate.unixToLedgerTimestamp(Date.parse(this.date));
    }
}

export default LedgerDate;
