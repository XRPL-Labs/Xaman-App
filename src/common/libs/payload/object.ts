import { get, has, isObject, isString } from 'lodash';
import codec from 'ripple-binary-codec';

import ApiService from '@services/ApiService';
import LoggerService from '@services/LoggerService';

import { SHA1 } from '@common/libs/crypto';

import { GetDeviceUniqueId } from '@common/helpers/device';

import { TransactionFactory } from '@common/libs/ledger/factory';

import Localize from '@locale';

import { PseudoTransactionTypes, TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { ApplicationType, MetaType, PatchSuccessType, PayloadOrigin, PayloadReferenceType, PayloadType } from './types';

// errors
import errors from './errors';

// create logger
const logger = LoggerService.createLogger('Payload');

/* Payload  ==================================================================== */
export class Payload {
    public readonly ClassName = 'Payload';

    meta: MetaType;
    application: ApplicationType;
    payload: PayloadReferenceType;
    origin: PayloadOrigin;
    generated: boolean;

    /**
     * get payload object from payload UUID or payload Json
     * @param args
     * @param origin
     */
    static async from(args: string | PayloadType, origin?: PayloadOrigin): Promise<Payload> {
        const payload = new Payload();

        // set payload origin
        if (origin) {
            payload.setOrigin(origin);
        } else {
            payload.setOrigin(PayloadOrigin.UNKNOWN);
        }

        // if Payload UUID passed then fetch the payload from backend
        if (isString(args)) {
            const res = await payload.fetch(args);
            payload.assign(res);
        } else if (isObject(args)) {
            // if not,  assign it to the class
            payload.assign(args);
        } else {
            throw new Error('invalid args applied, only string or object');
        }

        return payload;
    }

    /**
     * build payload from inside the app
     * @param TxJson Ledger format TXJson
     * @param message
     */
    static build(TxJson: TransactionJSONType, message?: string): Payload {
        const instance = new Payload();

        // force the signer accounts if account is set in transaction
        const signers = TxJson.Account ? [TxJson.Account] : [];

        // set meta flag including submit and instruction message
        instance.meta = {
            submit: true,
            custom_instruction: message,
            signers,
        };

        // set the payload and transaction type
        instance.payload = {
            tx_type: TxJson.TransactionType as TransactionTypes,
            request_json: TxJson,
        };

        // set generated flag
        instance.generated = true;

        return instance;
    }

    /**
     * Get Payload create date
     */
    get Date(): string {
        return this.payload.created_at;
    }

    /**
     * Verify the requested tx checksum
     * @param  {PayloadReferenceType} payload
     * @returns Promise<boolean>
     */
    verify = async (payload: PayloadReferenceType): Promise<boolean> => {
        try {
            const { hash, request_json, tx_type } = payload;

            // check if tx_type is same as request_json
            if (
                (tx_type === PseudoTransactionTypes.SignIn && request_json.TransactionType) ||
                (tx_type !== PseudoTransactionTypes.SignIn && request_json.TransactionType !== tx_type)
            ) {
                return false;
            }

            // encode + hash and check for the checksum
            const deviceId = GetDeviceUniqueId();
            const encodedTX = codec.encode(request_json);
            const checksum = await SHA1(`${encodedTX}+${deviceId}`);

            return checksum === hash;
        } catch {
            return false;
        }
    };

    /**
     *  Assign payload origin to object
     * @param origin PayloadOrigin
     */
    setOrigin = (origin: PayloadOrigin) => {
        this.origin = origin;
    };

    /**
     * Get payload origin
     * @return PayloadOrigin
     */
    getOrigin = (): PayloadOrigin => {
        return this.origin || PayloadOrigin.UNKNOWN;
    };

    /**
     *  Assign payload object to class
     * @param object
     */
    assign = (object: PayloadType) => {
        const { payload, application, meta } = object;
        Object.assign(this, { payload, application, meta });
    };

    /**
     * fetch payload by UUID from backend
     * @param uuid
     */
    fetch = (uuid: string): Promise<PayloadType> => {
        return new Promise((resolve, reject) => {
            ApiService.payload
                .get({ uuid, from: this.getOrigin() })
                .then(async (res: PayloadType) => {
                    // get verification status
                    const verified = await this.verify(res.payload);

                    if (!verified) {
                        reject(new Error(Localize.t('payload.UnableVerifyPayload')));
                        return;
                    }

                    if (get(res, 'response.resolved_at')) {
                        reject(new Error(Localize.t('payload.payloadAlreadyResolved')));
                        return;
                    }

                    if (get(res, 'meta.expired')) {
                        reject(new Error(Localize.t('payload.payloadExpired')));
                        return;
                    }

                    resolve(res);
                })
                .catch((response: any) => {
                    if (has(response, 'error')) {
                        const { error } = response;

                        const code = get(error, 'code');
                        const reference = get(error, 'reference');

                        // known error message's
                        if (code && has(errors, code)) {
                            const errorMessage = get(errors, error.code);
                            return reject(new Error(errorMessage));
                        }

                        return reject(new Error(Localize.t('payload.unexpectedErrorOccurred', { reference })));
                    }
                    return reject(new Error(Localize.t('global.unexpectedErrorOccurred')));
                });
        });
    };

    /**
     * patch the payload to the backend
     * @param patch
     */
    patch = (patch: PatchSuccessType) => {
        // ignore the method if payload is generated
        if (!this.isGenerated()) {
            // set extra data to the patch
            Object.assign(patch, {
                permission: {
                    push: true,
                    days: 365,
                },
                origintype: this.getOrigin(),
            });

            ApiService.payload.patch({ uuid: this.getPayloadUUID() }, patch).catch((e: any) => {
                logger.debug('Patch error', e);
            });

            return true;
        }

        return false;
    };

    /**
     * reject the payload
     */
    reject = (initiator: 'USER' | 'XUMM', reason?: string) => {
        // ignore the method if payload is generated
        if (this.isGenerated()) {
            return;
        }

        ApiService.payload
            .patch(
                { uuid: this.getPayloadUUID() },
                {
                    reject: true,
                    reject_initiator: initiator,
                    reject_reason: reason,
                    origintype: this.getOrigin(),
                },
            )
            .catch((e: any) => {
                logger.debug('Reject error', e);
            });
    };

    /**
     * validate payload by fetching it again
     */
    validate = () => {
        return this.fetch(this.getPayloadUUID());
    };

    /**
     * check if we need to submit the tx to the ledger
     */
    shouldSubmit = (): boolean => {
        return this.meta.submit && !this.isSignIn() && !this.isMultiSign();
    };

    /**
     * Return true if transaction should be sign as multi sign
     */
    isMultiSign = (): boolean => {
        return !!this.meta.multisign;
    };

    /**
     * Return true if payload generated by xumm
     */
    isGenerated = (): boolean => {
        return !!this.generated;
    };

    /**
     * Return true if payload is SignIn transaction
     */
    isSignIn = (): boolean => {
        return this.getTransactionType() === PseudoTransactionTypes.SignIn;
    };

    isPathFinding = (): boolean => {
        return !!this.meta.pathfinding;
    };

    /**
     * Get transaction
     */
    getTransaction(): Transactions {
        const { request_json } = this.payload;

        // check if transaction type is supported
        if (
            request_json.TransactionType &&
            !Object.values(TransactionTypes).includes(request_json.TransactionType as TransactionTypes)
        ) {
            throw new Error('Requested transaction type is not supported in XUMM!');
        }

        // craft transaction base on requested json
        const craftedTransaction = TransactionFactory.fromJson(request_json);

        // check assigned transaction have the same type as reported from backend
        // NOTE: this should never happen
        if (!this.isSignIn() && craftedTransaction.TransactionType !== this.getTransactionType()) {
            throw new Error('Parsed transaction have invalid transaction type!');
        }

        // the SignIn transactions should not have type as it's a pseudo transaction
        if (this.isSignIn() && craftedTransaction.TransactionType) {
            throw new Error('SignIn pseudo transaction should not contain transaction type!');
        }

        return craftedTransaction;
    }

    /**
     * get payload uuid identifier
     */
    getPayloadUUID = () => {
        return this.meta.uuid;
    };

    /**
     * get payload return url
     */
    getReturnURL = () => {
        return this.meta.return_url_app;
    };

    /**
     * Return payload application name
     */
    getApplicationName = (): string => {
        if (this.isGenerated()) {
            return 'XUMM';
        }
        return this.application.name;
    };

    /**
     * Return payload application icon
     */
    getApplicationIcon = (): string => {
        if (this.isGenerated()) {
            return 'https://xumm-cdn.imgix.net/app-logo/91348bab-73d2-489a-bb7b-a8dba83e40ff.png';
        }
        return this.application.icon_url;
    };

    /**
     * Return payload custom instruction
     */
    getCustomInstruction = (): string => {
        return this.meta.custom_instruction;
    };

    /**
     * Return payload transaction type
     */
    getTransactionType = (): TransactionTypes | PseudoTransactionTypes => {
        return this.payload.tx_type;
    };

    /**
     * Return list of signers payload forced
     */
    getSigners = (): string[] => {
        const { signers } = this.meta;

        if (Array.isArray(signers) && signers.length > 0) {
            return signers;
        }

        return undefined;
    };
}
