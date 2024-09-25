import { v4 as uuidv4 } from 'uuid';
import { get, isObject, isString, isUndefined } from 'lodash';

import { AppConfig } from '@common/constants';
import { Endpoints } from '@common/constants/endpoints';

import ApiService, { ApiError } from '@services/ApiService';
import LoggerService from '@services/LoggerService';

import CoreRepository from '@store/repositories/core';

import { TransactionFactory } from '@common/libs/ledger/factory';

import Localize from '@locale';

import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';
import { MutatedTransaction, SignableTransaction } from '@common/libs/ledger/transactions/types';

import {
    ApplicationType,
    MetaType,
    PatchSubmitType,
    PatchSuccessType,
    PayloadOrigin,
    PayloadReferenceType,
    PayloadType,
} from './types';

import { MixingTypes } from '@common/libs/ledger/mixin/types';

import { DigestSerializeWithSHA1 } from './digest';

// errors
import { PayloadErrors } from './errors';

// create logger
const logger = LoggerService.createLogger('Payload');

/* Payload  ==================================================================== */
export class Payload {
    meta!: MetaType;
    application!: ApplicationType;
    payload!: PayloadReferenceType;
    origin!: PayloadOrigin;
    generated!: boolean;

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
     * @param custom_instruction
     * @param submit
     */
    static build(TxJson: TransactionJson, custom_instruction?: string, submit = true): Payload {
        const instance = new Payload();

        // force the signer accounts if account is set in transaction
        const signers = TxJson.Account ? [TxJson.Account] : [];

        instance.meta = {
            uuid: uuidv4(),
            submit, // submit by default
            signers, // only can be signed by tx Account or any
            custom_instruction,
        };

        // set the payload and transaction type
        instance.payload = {
            tx_type: TxJson.TransactionType as TransactionTypes,
            request_json: TxJson,
            created_at: new Date().toISOString(),
            expires_at: new Date().toISOString(),
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

            const isPseudoTransaction = tx_type in PseudoTransactionTypes;

            // Pseudo transactions should not have transaction type
            if (isPseudoTransaction && request_json.TransactionType) {
                return false;
            }

            // for normal transactions tx_type should be the same as request_json TransactionType
            if (!isPseudoTransaction && request_json.TransactionType !== tx_type) {
                return false;
            }

            // get digest for request json object
            const digest = await DigestSerializeWithSHA1.digest(request_json);

            return digest === hash;
        } catch (error: any) {
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
            ApiService.fetch(Endpoints.Payload, 'GET', { uuid, from: this.getOrigin() }, undefined, {
                'X-Xaman-Digest': DigestSerializeWithSHA1.DIGEST_HASH_ALGO,
            })
                .then(async (response: PayloadType) => {
                    // get verification status
                    const verified = await this.verify(response.payload);

                    // if not verified then
                    if (!verified) {
                        reject(new Error(Localize.t('payload.UnableVerifyPayload')));
                        return;
                    }

                    if (get(response, 'response.resolved_at')) {
                        reject(new Error(Localize.t('payload.payloadAlreadyResolved')));
                        return;
                    }

                    if (get(response, 'meta.expired')) {
                        reject(new Error(Localize.t('payload.payloadExpired')));
                        return;
                    }

                    resolve(response);
                })
                .catch((error: ApiError) => {
                    // known error
                    if (error.code && error.code in PayloadErrors) {
                        return reject(new Error(PayloadErrors[error.code]));
                    }

                    // unknown error
                    if (error.reference) {
                        return reject(
                            new Error(Localize.t('payload.unexpectedErrorOccurred', { reference: error.reference })),
                        );
                    }

                    // unexpected error
                    return reject(new Error(Localize.t('global.unexpectedErrorOccurred')));
                });
        });
    };

    /**
     * patch the payload to the backend
     * @param patch
     */
    patch = (patch: PatchSuccessType | PatchSubmitType) => {
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

            ApiService.fetch(Endpoints.Payload, 'PATCH', { uuid: this.getPayloadUUID() }, patch).catch(
                (error: ApiError) => {
                    logger.error(`Patch ${this.getPayloadUUID()}`, error);
                },
            );

            return true;
        }

        return false;
    };

    /**
     * reject the payload
     */
    reject = (initiator: 'USER' | 'APP', reason?: string) => {
        // ignore the method if payload is generated
        if (this.isGenerated()) {
            return;
        }

        ApiService.fetch(
            Endpoints.Payload,
            'PATCH',
            { uuid: this.getPayloadUUID() },
            {
                reject: true,
                reject_initiator: initiator,
                reject_reason: reason,
                origintype: this.getOrigin(),
            },
        ).catch((error: ApiError) => {
            logger.error(`Patch reject ${this.getPayloadUUID()}`, error);
        });
    };

    /**
     * validate payload by fetching it again
     */
    validate = () => {
        return this.fetch(this.getPayloadUUID());
    };

    /**
     * Check if we need to submit the tx to the ledger
     * only submit when dev indicated and not Pseudo transaction and not multi sign transaction
     */
    shouldSubmit = (): boolean => {
        return this.meta.submit && !this.isPseudoTransaction() && !this.isMultiSign();
    };

    /**
     * Return true if transaction should be sign as multi sign
     */
    isMultiSign = (): boolean => {
        return !!this.meta.multisign;
    };

    /**
     * Return true if payload generated by Xaman
     */
    isGenerated = (): boolean => {
        return !!this.generated;
    };

    /**
     * Return true if payload is Pseudo transaction
     */
    isPseudoTransaction = (): boolean => {
        const { request_json } = this.payload;
        return isUndefined(get(request_json, 'TransactionType', undefined));
    };

    /**
     * Return true if path finding is enabled in the payload
     */
    isPathFinding = (): boolean => {
        return !!this.meta.pathfinding;
    };

    /**
     * Get transaction
     */
    getTransaction(): SignableTransaction & MutatedTransaction {
        const { request_json, tx_type } = this.payload;

        // check if pseudo transaction and supported by the app
        if (
            !request_json.TransactionType &&
            !Object.values(PseudoTransactionTypes).includes(tx_type as PseudoTransactionTypes)
        ) {
            throw new Error(`Requested pseudo transaction type "${request_json.TransactionType} is not supported".`);
        }

        // check if normal transaction and supported by the app
        // NOTE: only in case of developer mode enabled we allow transaction fallback
        if (
            request_json.TransactionType &&
            !Object.values(TransactionTypes).includes(request_json.TransactionType as TransactionTypes)
        ) {
            if (CoreRepository.isDeveloperModeEnabled()) {
                logger.warn(
                    `Requested transaction type "${request_json.TransactionType}" not found, revert to fallback transaction.`,
                );
            } else {
                throw new Error(
                    `Requested transaction type "${request_json.TransactionType} is not supported at the moment.`,
                );
            }
        }

        let craftedTransaction;

        if (this.isPseudoTransaction()) {
            craftedTransaction = TransactionFactory.getPseudoTransaction(
                { ...request_json },
                tx_type as PseudoTransactionTypes,
                [MixingTypes.Sign, MixingTypes.Mutation],
            ) as SignableTransaction & MutatedTransaction;
        } else {
            craftedTransaction = TransactionFactory.getTransaction(
                {
                    ...request_json,
                },
                undefined,
                [MixingTypes.Sign, MixingTypes.Mutation],
            ) as SignableTransaction & MutatedTransaction;
        }

        // check assigned transaction have the same type as reported from backend
        // NOTE: THIS SHOULD NEVER HAPPEN
        if (craftedTransaction.TransactionType && craftedTransaction.TransactionType !== this.getTransactionType()) {
            throw new Error('Parsed transaction have invalid transaction type!');
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
            return AppConfig.appName;
        }
        return this.application.name;
    };

    /**
     * Return payload application icon
     */
    getApplicationIcon = (): string => {
        if (this.isGenerated()) {
            // FIXME: change to AppIcon/ic_luncher after removing the `xumm-cdn.imgix.net`
            return 'https://xumm-cdn.imgix.net/app-logo/91348bab-73d2-489a-bb7b-a8dba83e40ff.png';
        }
        return this.application.icon_url;
    };

    /**
     * Return payload custom instruction
     */
    getCustomInstruction = (): string | undefined => {
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

        return [];
    };

    /**
     * Return forced network if any
     */
    getForcedNetwork = (): string | undefined => {
        const { force_network } = this.meta;

        if (typeof force_network === 'string') {
            return force_network;
        }

        return undefined;
    };

    /**
     * Return the time when payload has been created
     */
    getRequestTime = () => {
        return this.payload.created_at;
    };
}
