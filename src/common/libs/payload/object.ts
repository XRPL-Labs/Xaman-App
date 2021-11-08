import { isString, isObject, has, get } from 'lodash';

import codec from 'ripple-binary-codec';

// Services
import ApiService from '@services/ApiService';
import LoggerService from '@services/LoggerService';

import { SHA1 } from '@common/libs/crypto';

import { GetDeviceUniqueId } from '@common/helpers/device';
// locale
import Localize from '@locale';

// types
import { TransactionJSONType } from '@common/libs/ledger/types';

import { PayloadType, MetaType, ApplicationType, PatchSuccessType, PayloadReferenceType, PayloadOrigin } from './types';

// errors
import errors from './errors';

// create logger
const logger = LoggerService.createLogger('Payload');

/* Payload  ==================================================================== */
export class Payload {
    meta: MetaType;
    application: ApplicationType;
    payload: PayloadReferenceType;
    origin: PayloadOrigin;
    ClassName: string;

    constructor() {
        this.ClassName = 'Payload';
    }

    /**
     * get payload object from payload UUID or payload Json
     * @param args
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
     */
    static build(TxJson: TransactionJSONType, message?: string): Promise<Payload> {
        const payload = {} as Payload;

        payload.application = {
            name: 'XUMM',
            description: 'Description about XUMM',
            disabled: 0,
            uuidv4: '',
            icon_url: 'https://xumm-cdn.imgix.net/app-logo/91348bab-73d2-489a-bb7b-a8dba83e40ff.png',
        };

        payload.meta = {
            submit: true,
            generated: true,
            custom_instruction: message,
        };

        payload.payload = {
            tx_type: TxJson.TransactionType,
            tx_destination: '',
            tx_destination_tag: null,
            request_json: TxJson,
        };

        return Payload.from(payload);
    }

    /**
     * Get Payload create date
     */
    get Date(): Date {
        return this.payload.created_at;
    }

    /**
     * Get JSON transaction ledger format of payload
     */
    get TxJson(): TransactionJSONType {
        return this.payload.request_json;
    }

    /**
     * Verify the requested tx checksum
     * @param  {PayloadReferenceType} payload
     * @returns Promise<boolean>
     */
    verify = async (payload: PayloadReferenceType): Promise<boolean> => {
        try {
            const deviceId = GetDeviceUniqueId();

            const encodedTX = codec.encode(payload.request_json);

            const checksum = await SHA1(`${encodedTX}+${deviceId}`);

            if (checksum === payload.hash) {
                return true;
            }

            return false;
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
        Object.assign(this, object);
    };

    /**
     * fetch payload by UUID from backend
     * @param uuid
     */
    fetch = (uuid: string): Promise<PayloadType> => {
        return new Promise((resolve, reject) => {
            return ApiService.payload
                .get({ uuid, from: this.getOrigin() })
                .then(async (res: PayloadType) => {
                    // get verification status
                    const verified = await this.verify(res.payload);

                    if (!verified) {
                        return reject(new Error(Localize.t('payload.UnableVerifyPayload')));
                    }

                    if (get(res, 'response.resolved_at')) {
                        return reject(new Error(Localize.t('payload.payloadAlreadyResolved')));
                    }

                    if (get(res, 'meta.expired')) {
                        return reject(new Error(Localize.t('payload.payloadExpired')));
                    }

                    return resolve(res);
                })
                .catch((err: any) => {
                    if (has(err, 'code')) {
                        const errorMessage = get(errors, err.code);
                        return reject(new Error(errorMessage));
                    }

                    if (has(err, 'error')) {
                        const { error } = err;
                        if (has(error, 'code')) {
                            const errorMessage = get(errors, error.code);

                            return reject(new Error(errorMessage));
                        }

                        return reject(
                            new Error(Localize.t('payload.unexpectedErrorOccurred', { reference: error.reference })),
                        );
                    }
                    return reject(new Error(Localize.t('global.unexpectedErrorOccurred')));
                });
        });
    };

    /**
     * patch the payload to the backend
     * @param permission push permission
     */
    patch = (patch: PatchSuccessType) => {
        if (!this.meta.generated) {
            // set extra data to the patch
            Object.assign(patch, {
                permission: {
                    push: true,
                    days: 365,
                },
                origintype: this.getOrigin(),
            });

            ApiService.payload.patch({ uuid: this.meta.uuid }, patch).catch((e: any) => {
                logger.debug('Patch error', e);
            });
        }
    };

    /**
     * reject the payload
     */
    reject = () => {
        if (!this.meta.generated) {
            ApiService.payload
                .patch(
                    { uuid: this.meta.uuid },
                    {
                        reject: true,
                        origintype: this.getOrigin(),
                    },
                )
                .catch((e: any) => {
                    logger.debug('Reject error', e);
                });
        }
    };

    /**
     * validate payload by fetching it again
     */
    validate = () => {
        return this.fetch(this.meta.uuid);
    };

    /**
     * get payload return url
     */
    getReturnURL = () => {
        return this.meta.return_url_app;
    };

    /**
     * check if we need to submit the tx to the ledger
     */
    shouldSubmit = (): boolean => {
        return this.meta.submit && this.payload.tx_type !== 'SignIn' && !this.meta.multisign;
    };

    /**
     * Return true if should sign as multi sign
     */
    isMultiSign = (): boolean => {
        return !!this.meta.multisign;
    };

    /**
     * Return true if payload generated by xumm
     */
    isGenerated = (): boolean => {
        return !!this.meta.generated;
    };
}
