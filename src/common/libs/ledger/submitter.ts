import { assign, has } from 'lodash';

import * as AccountLib from 'xrpl-accountlib';

import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import { LedgerService, LoggerService, SocketService } from '@services';

import { TransactionJSONType, SignedObjectType, SubmitResultType, VerifyResultType } from './types';

class Submitter {
    txJson: TransactionJSONType;
    signAs: string;
    signer: AccountLib.XRPL_Account;
    signedObject: SignedObjectType;
    transactionId: string;
    logger: any;

    constructor(tx: TransactionJSONType | string, privateKey?: string, multiSign?: boolean) {
        // this is txJson
        if (typeof tx === 'object') {
            if (!has(tx, 'Account')) {
                throw new Error('Account is not set!');
            }
            this.txJson = tx;
            this.signAs = tx.Account;
            this.signer = AccountLib.derive.privatekey(privateKey);
            this.signedObject = undefined;
            this.transactionId = undefined;
            this.logger = LoggerService.createLogger('Submitter');

            // check if multi sign
            if (multiSign) {
                this.signer = this.signer.signAs(this.signer.address);
            }
        } else {
            // this a signed tx
            this.signedObject = {
                signedTransaction: tx,
            };
        }
    }

    async prepare() {
        // if fee not set then get current network fee
        if (!has(this.txJson, 'Fee')) {
            const { Fee } = LedgerService.getLedgerStatus();
            if (Fee) {
                assign(this.txJson, { Fee: Fee.toString() });
            }
        }

        // if account sequence not set get the latest account sequence
        if (!has(this.txJson, 'Sequence')) {
            const accountInfo = await LedgerService.getAccountInfo(this.signAs);
            if (!has(accountInfo, 'error') && has(accountInfo, ['account_data', 'Sequence'])) {
                const { account_data } = accountInfo;
                assign(this.txJson, { Sequence: account_data.Sequence });
            }
        }

        // if account not set , set the signing account
        if (!has(this.txJson, 'Account')) {
            assign(this.txJson, { Account: this.signer.address });
        }

        // When a transaction has a Max Ledger property + value and the value < 32570,
        // use the existing Ledger + the entered value at the moment of signing.
        if (has(this.txJson, 'LastLedgerSequence')) {
            if (this.txJson.LastLedgerSequence < 32570) {
                const { LastLedger } = LedgerService.getLedgerStatus();
                if (LastLedger) {
                    assign(this.txJson, { LastLedgerSequence: LastLedger + this.txJson.LastLedgerSequence });
                }
            }
        }

        /* eslint-disable-next-line spellcheck/spell-checker */
        this.txJson.Flags |= txFlags.Universal.FullyCanonicalSig;

        /* eslint-disable-next-line spellcheck/spell-checker */
        // JavaScript converts operands to 32-bit signed ints before doing bitwise
        // operations. We need to convert it back to an unsigned int.
        this.txJson.Flags >>>= 0;
    }

    static verify = (transactionId?: string): Promise<VerifyResultType> => {
        return new Promise(resolve => {
            // wait for ledger close event
            let verified = false;
            const ledgerListener = async () => {
                LedgerService.getTransaction(transactionId)
                    .then((tx: any) => {
                        if (tx.validated) {
                            SocketService.offEvent('ledger', ledgerListener);
                            verified = true;

                            const { TransactionResult } = tx.meta;

                            resolve({
                                success: TransactionResult === 'tesSUCCESS',
                                transaction: tx,
                            });
                        }
                    })
                    .catch(() => {});
            };

            SocketService.onEvent('ledger', ledgerListener);

            // timeout after 20 sec
            setTimeout(() => {
                if (!verified) {
                    SocketService.offEvent('ledger', ledgerListener);
                    resolve({
                        success: false,
                    });
                }
            }, 30000);
        });
    };

    async prepareAndSign(): Promise<SignedObjectType> {
        return this.prepare()
            .then(() => {
                try {
                    this.signedObject = AccountLib.sign(this.txJson, this.signer);
                } catch (e) {
                    this.logger.error('Error Sign TX', e);
                    throw new Error('Unable sign the transaction, please try again!');
                }
                return this.signedObject;
            })
            .catch(e => {
                this.logger.error('Error Prepare transaction', e);
                throw new Error('Unable prepare the transaction, please try again!');
            });
    }

    async submit(): Promise<SubmitResultType> {
        // TODO: handle error
        /* eslint-disable-next-line */
        return new Promise(async resolve => {
            try {
                this.logger.debug('Submit TX:', this.txJson);

                if (!this.signedObject) {
                    await this.prepareAndSign();
                }

                const submitResult = await LedgerService.submit(this.signedObject.signedTransaction);

                const { error, tx_json, error_exception, engine_result, engine_result_message } = submitResult;

                // set the transaction id for verification
                this.transactionId = this.signedObject.id || tx_json.hash;

                // create default result
                const result = {
                    node: SocketService.node,
                    nodeType: SocketService.nodeType,
                    transactionId: this.transactionId,
                };

                // error happened in validation of transaction
                // probably something missing
                if (error) {
                    return resolve(
                        Object.assign(result, {
                            success: false,
                            engineResult: 'FAILED',
                            message: error_exception,
                        }),
                    );
                }

                // result code prefix
                const prefix = engine_result.substr(0, 3);

                // probably success submit
                if (['tes', 'tel', 'ter'].indexOf(prefix) > -1) {
                    return resolve(
                        Object.assign(result, {
                            success: true,
                            engineResult: engine_result,
                            message: engine_result_message,
                        }),
                    );
                }

                // didn't got any possible success result
                return resolve(
                    Object.assign(result, {
                        success: false,
                        engineResult: engine_result,
                        message: engine_result_message,
                    }),
                );
            } catch (e) {
                // something wrong happened
                return resolve({
                    success: false,
                    engineResult: 'telFAILED',
                    message: e.message,
                    node: SocketService.node,
                    nodeType: SocketService.nodeType,
                });
            }
        });
    }
}

export default Submitter;
