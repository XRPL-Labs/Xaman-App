/**
 * Transaction Signed Type
 */
export type SignedObjectType = {
    type?: 'SignedTx' | 'MultiSignedTx' | 'SignedPayChanAuth';
    id?: string;
    signedTransaction: string;
    txJson?: Object;
    signers?: string[];
    signerPubKey?: string;
    signMethod?: 'PIN' | 'BIOMETRIC' | 'PASSPHRASE' | 'TANGEM' | 'OTHER';
};

/**
 * Submit Result Type
 */
export type SubmitResultType = {
    success: boolean;
    engineResult: string;
    message: string;
    hash?: string;
    network?: {
        id: number;
        node: string;
        type: string;
        key: string;
    };
};

/**
 * Verify Result Type
 */
export type VerifyResultType = {
    success: boolean;
    transaction?: any;
};

/**
 * GenesisMints type
 */
export interface GenesisMintsType
    extends Array<{
        GenesisMint: {
            Amount: string;
            Destination: string;
        };
    }> {}
