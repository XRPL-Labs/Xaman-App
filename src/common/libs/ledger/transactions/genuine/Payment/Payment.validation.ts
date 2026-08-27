import NetworkService from '@services/NetworkService';
import LedgerService from '@services/LedgerService';

import { ErrorMessages } from '@common/constants';
import { AmountType } from '@common/libs/ledger/parser/types';
import { NormalizeAmount, NormalizeCurrencyCode } from '@common/utils/monetary';

import Localize from '@locale';

import Payment from './Payment.class';

import LoggerService, { LoggerInstance } from '@services/LoggerService';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

const log: LoggerInstance = LoggerService.createLogger('PayValLogger');

/* Validation ==================================================================== */
const PaymentValidation: ValidationType<Payment> = (tx: Payment): Promise<void> => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        log.debug('PaymentValidation');

        try {
            // ignore validation if transaction including Path
            if (tx.Paths) {
                resolve();
                return;
            }

            log.debug('PaymentValidation#1');

            // check if amount is present
            if (!tx.Amount || !tx.Amount?.value || tx.Amount?.value === '0') {
                reject(new Error(Localize.t('send.pleaseEnterAmount')));
                return;
            }

            log.debug('PaymentValidation#2', tx.Amount);
            // ===== check if recipient have proper TrustLine when delivering IOU =====
            // Note: ignore if sending to the issuer
            if (
                tx.Amount.currency !== NetworkService.getNativeAsset() &&
                tx.Amount.issuer !== tx.Destination &&
                !tx.Amount?.mpt_issuance_id
            ) {
                log.debug('PaymentValidation#3');
                const destinationLine = await LedgerService.getFilteredAccountLine(tx.Destination, {
                    issuer: tx.Amount.issuer!,
                    currency: tx.Amount.currency,
                });

                if (
                    !destinationLine ||
                    (Number(destinationLine.limit) === 0 && Number(destinationLine.balance) === 0)
                ) {
                    reject(new Error(Localize.t('send.unableToSendPaymentRecipientDoesNotHaveTrustLine')));
                    return;
                }
            }

            let NativeAmount: AmountType | undefined;

            // SendMax have higher priority
            if (tx.SendMax && tx.SendMax.currency === NetworkService.getNativeAsset()) {
                NativeAmount = tx.SendMax;
            } else if (tx.Amount.currency === NetworkService.getNativeAsset() && !tx.SendMax) {
                NativeAmount = tx.Amount;
            }

            log.debug('PaymentValidation#4');

            if (NativeAmount) {
                log.debug('PaymentValidation#5');
                // ===== check balance =====
                try {
                    // fetch fresh account balance from ledger
                    const availableBalance = await LedgerService.getAccountAvailableBalance(tx.Account);
                    log.debug('PaymentValidation#6');
                    if (Number(NativeAmount.value) > Number(availableBalance)) {
                        reject(
                            new Error(
                                Localize.t('send.insufficientBalanceSpendableBalance', {
                                    spendable: Localize.formatNumber(availableBalance),
                                    currency: NetworkService.getNativeAsset(),
                                }),
                            ),
                        );
                        return;
                    }
                } catch (e) {
                    log.debug('PaymentValidation#7');
                    reject(new Error(Localize.t('account.unableGetAccountInfo')));
                    return;
                }
            }

            log.debug('PaymentValidation#8');

            let IOUAmount: AmountType | undefined;

            // SendMax have higher priority
            if (tx.SendMax && tx.SendMax.currency !== NetworkService.getNativeAsset()) {
                IOUAmount = tx.SendMax;
            } else if (tx.Amount.currency !== NetworkService.getNativeAsset() && !tx.SendMax) {
                IOUAmount = tx.Amount;
            }

            if (IOUAmount) {
                log.debug('PaymentValidation#9');
                // ===== check balances =====
                // sender is not issuer
                if (IOUAmount.issuer !== tx.Account) {
                    // check IOU balance
                    const sourceLine = await LedgerService.getFilteredAccountLine(tx.Account, {
                        issuer: IOUAmount.issuer!,
                        currency: IOUAmount.currency,
                    });

                    // TODO: show proper error message
                    if (!sourceLine) {
                        resolve();
                        return;
                    }

                    // check if asset is frozen by issuer
                    if (sourceLine.freeze_peer) {
                        reject(
                            new Error(
                                Localize.t('send.trustLineIsFrozenByIssuer', {
                                    currency: NormalizeCurrencyCode(sourceLine.currency),
                                }),
                            ),
                        );
                        return;
                    }

                    log.debug('PaymentValidation#10');

                    if (Number(IOUAmount.value) > Number(sourceLine.balance)) {
                        reject(
                            new Error(
                                Localize.t('send.insufficientBalanceSpendableBalance', {
                                    spendable: Localize.formatNumber(NormalizeAmount(sourceLine.balance)),
                                    currency: NormalizeCurrencyCode(sourceLine.currency),
                                }),
                            ),
                        );
                        return;
                    }
                } else {
                    // sender is the issuer
                    // check for exceed the TrustLine Limit on obligations
                    log.debug('PaymentValidation#11');

                    const sourceLine = await LedgerService.getFilteredAccountLine(tx.Account, {
                        issuer: tx.Destination,
                        currency: IOUAmount.currency,
                    });

                    // TODO: show proper error message
                    if (!sourceLine) {
                        resolve();
                        return;
                    }

                    /**
                     * TODO: MPT: limit peer would be the amount max outstanding of the MPT
                     */
                    const limitPeer =
                        String(sourceLine.limit_peer || '').split('|').length > 1
                            ? Number(IOUAmount.value) + Math.abs(Number(sourceLine.balance)) // MPT
                            : Number(sourceLine.limit_peer);

                    if (Number(IOUAmount.value) + Math.abs(Number(sourceLine.balance)) > limitPeer) {
                        reject(
                            new Error(
                                Localize.t('send.trustLineLimitExceeded', {
                                    balance: Localize.formatNumber(
                                        NormalizeAmount(Math.abs(Number(sourceLine.balance))),
                                    ),
                                    peer_limit: Localize.formatNumber(NormalizeAmount(limitPeer)),
                                    available: Localize.formatNumber(
                                        NormalizeAmount(Number(limitPeer - Math.abs(Number(sourceLine.balance)))),
                                    ),
                                }),
                            ),
                        );
                        return;
                    }
                }
            }

            log.debug('PaymentValidation#12');

            resolve();
        } catch (e) {
            log.debug(`PaymentValidation#13: ${(e as Error)?.message}`);
            reject(new Error(ErrorMessages.unexpectedValidationError));
        }
    });
};

/* Export ==================================================================== */
export default PaymentValidation;
