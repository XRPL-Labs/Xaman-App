import Locale from '@locale';

const PayloadErrors: { [key: number]: string } = {
    403: Locale.t('payload.payloadHandledByAnotherClient'),
    404: Locale.t('payload.payloadNotFound'),
    405: Locale.t('payload.invalidPayloadResult'),
    409: Locale.t('payload.payloadAlreadyResolved'),
    509: Locale.t('payload.payloadCouldNotBeUpdated'),
    510: Locale.t('payload.payloadExpired'),
    511: Locale.t('payload.payloadAlreadySigned'),
    800: Locale.t('payload.invalidOrMissingSignedTransactionBlob'),
    801: Locale.t('payload.transactionBlobDecodeError'),
    802: Locale.t('payload.invalidTransactionId'),
    803: Locale.t('payload.transactionIdMismatch'),
    804: Locale.t('payload.InvalidMultiSignAccount'),
};

export { PayloadErrors };
