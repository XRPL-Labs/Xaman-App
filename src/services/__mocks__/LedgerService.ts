/* eslint-disable class-methods-use-this */
/* eslint-disable spellcheck/spell-checker */

class LedgerService {
    public getLedgerStatus() {
        return {
            Fee: 15,
            LastLedger: 6000000,
        };
    }

    public getNetworkReserve() {
        return {
            BaseReserve: 10,
            OwnerReserve: 2,
        };
    }

    public async getAccountInfo() {
        // return {
        //     account_data: {
        //         Balance: '49507625423',
        //         Domain: '787270746970626F742E636F6D',
        //         EmailHash: '833237B8665D2F4E00135E8DE646589F',
        //         Flags: 131072,
        //         LedgerEntryType: 'AccountRoot',
        //         OwnerCount: 1135,
        //         PreviousTxnID: '48DB4C987EDE802030089C48F27FF7A0F589EBA7C3A9F90873AA030D5960F149',
        //         PreviousTxnLgrSeq: 58057100,
        //         Sequence: 34321,
        //         index: '44EF183C00DFCB5DAF505684AA7967C83F42C085EBA6B271E5349CB12C3D5965',
        //         // @ts-ignore
        //         signer_lists: [],
        //         urlgravatar: 'http://www.gravatar.com/avatar/833237b8665d2f4e00135e8de646589f',
        //     },
        // };

        return {
            error: 'actNotFound',
            error_code: 19,
            error_message: 'Account not found.',
            id: 12,
            ledger_current_index: 58090905,
            status: 'error',
            type: 'response',
            validated: false,
        };
    }
}

export default new LedgerService();
