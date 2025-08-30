class LedgerService {
    getAccountSequence = jest.fn();
    getAccountBlockerObjects = jest.fn();
    getAccountInfo = jest.fn();
    getAccountAvailableBalance = jest.fn();
    getFilteredAccountLine = jest.fn();
    getTransactions = jest.fn();

    getLedgerStatus = () => {
        return {
            Fee: 15,
            LastLedger: 6000000,
        };
    };
}

export default new LedgerService();
