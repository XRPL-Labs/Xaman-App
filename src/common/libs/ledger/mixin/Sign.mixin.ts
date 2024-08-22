import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';

import { AccountModel } from '@store/models';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { SignedObjectType, SubmitResultType, VerifyResultType } from '@common/libs/ledger/types';
import { InstanceTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

import { Props as VaultOverlayProps } from '@screens/Overlay/Vault/types';

/* Types ==================================================================== */
import { TransactionResult } from '@common/libs/ledger/parser/types';
import { SignableTransaction } from '@common/libs/ledger/transactions/types';

import { Constructor, SignMethodType, SignMixinType } from './types';

/* Mixin ==================================================================== */
export function SignMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base implements SignMixinType {
        private _submitResult?: SubmitResultType;
        private _verifyResult?: VerifyResultType;
        private isAborted?: boolean;
        private isSubmitted?: boolean;

        public SignedBlob?: string;
        public SignerPubKey?: string;
        public SignMethod?: SignMethodType;
        public SignerAccount?: string;

        readonly DefaultLastLedgerOffset: number = 20;

        get SubmitResult(): SubmitResultType | undefined {
            return this._submitResult;
        }

        set SubmitResult(result: SubmitResultType) {
            this._submitResult = result;
        }

        get VerifyResult(): VerifyResultType | undefined {
            const result = this._verifyResult;

            if (typeof result === 'undefined') {
                return {
                    success: false,
                };
            }

            return result;
        }

        set VerifyResult(result: VerifyResultType) {
            this._verifyResult = result;
        }

        get FinalResult(): TransactionResult {
            // check for the result in meta data first, as we may find something there
            const transactionResult = (this._meta as any)?.TransactionResult;

            // this transaction already verified by network
            if (transactionResult === 'tesSUCCESS') {
                return {
                    success: true,
                    code: transactionResult,
                    message: undefined,
                };
            }

            // if already verified by network or
            // submitted result was successful
            // or verify result was successful
            const code = transactionResult || this._submitResult?.engineResult;
            const success = code === 'tesSUCCESS' || !!this._verifyResult?.success;
            const message = !success ? this._submitResult?.message : undefined;

            return {
                success,
                code,
                message,
            };
        }

        /**
         Prepare the transaction for signing, including setting the account sequence
         * @returns {Promise<void>}
         */
        prepare = async (account: AccountModel): Promise<void> => {
            // ignore for pseudo transactions

            if (this.InstanceType === InstanceTypes.PseudoTransaction) {
                return;
            }

            // throw error if transaction fee is not set
            // transaction fee's should always been set and shown to user before signing
            if (typeof this.Fee === 'undefined') {
                throw new Error(Localize.t('global.transactionFeeIsNotSet'));
            }

            // if account sequence not set get the latest account sequence
            if (typeof this.Sequence === 'undefined') {
                try {
                    this.Sequence = await LedgerService.getAccountSequence(this.Account);
                } catch {
                    throw new Error(Localize.t('global.unableToSetAccountSequence'));
                }
            }

            // if PaymentChannelCrate and PublicKey is not set, set the signing account public key
            if (
                this.TransactionType === TransactionTypes.PaymentChannelCreate &&
                // @ts-expect-error
                typeof this.PublicKey === 'undefined'
            ) {
                // @ts-expect-error
                this.PublicKey = account.publicKey;
            }
        };

        /**
         Populate transaction LastLedgerSequence
         * @param {number} ledgerOffset max ledger gap
         * @returns {void}
         */
        populateFields = ({ lastLedgerOffset }: { lastLedgerOffset?: number } = {}): void => {
            // ignore for pseudo transactions
            if (this.InstanceType === InstanceTypes.PseudoTransaction) {
                return;
            }

            // NOTE: as tangem signing can take a lot of time we increase gap to 150 ledger
            const LastLedgerOffset = lastLedgerOffset || this.DefaultLastLedgerOffset;

            // if no LastLedgerSequence or LastLedgerSequence is already pass the threshold
            // update with LastLedger + 10
            const { LastLedger } = LedgerService.getLedgerStatus();
            // if unable to fetch the LastLedger probably user is not connected to the node
            if (!LastLedger) {
                throw new Error(Localize.t('global.unableToGetLastClosedLedger'));
            }
            // expected LastLedger sequence
            const ExpectedLastLedger = LastLedger + LastLedgerOffset;

            // if LastLedgerSequence is not set
            if (typeof this.LastLedgerSequence === 'undefined') {
                // only set if last ledger is set
                this.LastLedgerSequence = ExpectedLastLedger;
            } else if (this.LastLedgerSequence < 32570) {
                // When a transaction has a Max Ledger property + value and the value < 32570,
                // use the existing Ledger + the entered value at the moment of signing.
                this.LastLedgerSequence = LastLedger + this.LastLedgerSequence;
            } else if (this.LastLedgerSequence < ExpectedLastLedger) {
                // the Last Ledger is already passed, update it base on Last ledger
                this.LastLedgerSequence = ExpectedLastLedger;
            }

            // check if we need to populate NetworkID
            if (typeof this.NetworkID === 'undefined') {
                // get current network id
                const networkId = NetworkService.getNetworkId();
                // legacy networks have ids less than 1024, these networks cannot specify NetworkID in txn
                if (networkId > 1024) {
                    this.NetworkID = NetworkService.getNetworkId();
                }
            }
        };

        /**
         Sign the transaction with provided account
         * @param {AccountModel} account object sign with
         * @param multiSign
         * @returns {Promise<string>} signed tx blob
         */
        sign = (account: AccountModel, multiSign = false): Promise<string> => {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve, reject) => {
                try {
                    // account params should be provided
                    if (!account) {
                        reject(new Error('Account param is required!'));
                        return;
                    }

                    // transaction is already been signed?
                    if (this.SignedBlob) {
                        reject(new Error('Transaction already been signed!'));
                        return;
                    }

                    // check transaction can be signed by the network user is connected to
                    // before triggering the sign flow
                    // NOTE: skip for pseudo transactions
                    const definitions = NetworkService.getNetworkDefinitions();

                    if (
                        this.TransactionType &&
                        Array.isArray(definitions.transactionNames) &&
                        !definitions.transactionNames.includes(this.TransactionType)
                    ) {
                        reject(
                            new Error(
                                `Your current connected network doesn't support "${this.TransactionType}" transaction. Please switch to a compatible network.`,
                            ),
                        );
                        return;
                    }

                    // if account not set , set the signing account
                    if (typeof this.Account === 'undefined') {
                        this.Account = account.address;
                    }

                    // prepare transaction for signing
                    // skip if multiSing transaction
                    if (!multiSign) {
                        await this.prepare(account);
                    }

                    // if transaction aborted then don't continue
                    if (this.isAborted) {
                        reject(new Error('Transaction aborted!'));
                        return;
                    }

                    // show vault overlay and handle the reset of signing
                    Navigator.showOverlay<VaultOverlayProps>(AppScreens.Overlay.Vault, {
                        account,
                        multiSign,
                        transaction: this as unknown as SignableTransaction,
                        onSign: (signedObject: SignedObjectType) => {
                            const { id, signedTransaction, signerPubKey, signMethod, signers } = signedObject;

                            // verify the sign result
                            if (!signedTransaction || !signerPubKey || !signMethod) {
                                reject(
                                    new Error(
                                        'Unable sign the transaction, missing required values ' +
                                            'signedBlob, signerPubKey, signMethod',
                                    ),
                                );
                                return;
                            }

                            // only pseudo transactions are allowed to not have a transaction id
                            if (!id && this.InstanceType !== InstanceTypes.PseudoTransaction) {
                                reject(
                                    new Error(
                                        'Unable sign the transaction, Non-Pseudo transactions requires transaction id.',
                                    ),
                                );
                                return;
                            }

                            // set the transaction hash if exist
                            if (id) {
                                this.hash = id;
                            }

                            // set the sign variables
                            this.SignedBlob = signedTransaction;
                            this.SignMethod = signMethod;
                            this.SignerPubKey = signerPubKey;

                            if (Array.isArray(signers) && signers.length > 0) {
                                [this.SignerAccount] = signers;
                            }

                            resolve(this.SignedBlob);
                        },
                        onDismissed: reject,
                    });
                } catch (e) {
                    reject(e);
                }
            });
        };

        /*
        Verify the transaction from ledger
        */
        verify = async (): Promise<VerifyResultType> => {
            if (!this.hash) {
                throw new Error('transaction hash is required for verification!');
            }

            const verifyResult = await LedgerService.verifyTransaction(this.hash);

            // assign the new transaction from ledger
            if (verifyResult?.transaction) {
                const { transaction } = verifyResult;

                this._meta = transaction.meta;
                this._tx = transaction;
            }

            // persist verify result
            this.VerifyResult = { success: verifyResult.success };

            return verifyResult;
        };

        /*
        Submit the signed transaction to the Ledger
        */
        submit = async (): Promise<SubmitResultType> => {
            try {
                // if transaction is not signed exit
                if (!this.SignedBlob) {
                    throw new Error('transaction is not signed!');
                }

                // if transaction is already submitted exit
                if (this.SubmitResult || this.isSubmitted) {
                    throw new Error('transaction is in submitting phase or has been submitted to the ledger!');
                }

                // if transaction aborted then don't continue
                if (this.isAborted) {
                    throw new Error('Transaction aborted!');
                }

                // set isSubmitted to true for preventing the transaction to be submitted multiple times
                this.isSubmitted = true;

                // fail transaction locally if AccountDelete
                // do not retry or relay the transaction to other servers
                // this will prevent fee burn if something wrong on AccountDelete transactions
                const shouldFailHard = this.TransactionType === TransactionTypes.AccountDelete;

                // Submit signed transaction to the Ledger
                const submitResult = await LedgerService.submitTransaction(this.SignedBlob, this.hash!, shouldFailHard);

                // set submit result
                this.SubmitResult = submitResult;

                return submitResult;
            } catch (error: any) {
                // TODO: add logging for this
                // something went wrong
                const result = {
                    success: false,
                    engineResult: 'telFAILED',
                    message: error?.message,
                    network: undefined,
                } as SubmitResultType;

                // set submit result
                this.SubmitResult = result;

                return result;
            }
        };

        /*
        Abort the transaction if on progress
        this will just set a flag
        */
        abort = () => {
            this.isAborted = true;
        };
    };
}
