import NetworkService from '@services/NetworkService';
import LedgerService from '@services/LedgerService';

import { ErrorMessages } from '@common/constants';
import { AmountType } from '@common/libs/ledger/parser/types';
import { NormalizeAmount, NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import Payment from './PaymentClass';

/* Validator ==================================================================== */
const PaymentValidation = (tx: Payment): Promise<void> => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        try {
            // ignore validation if transaction including Path
            if (tx.Paths) {
                resolve();
                return;
            }

            // check if amount is present
            if (!tx.Amount || !tx.Amount?.value || tx.Amount?.value === '0') {
                reject(new Error(Localize.t('send.pleaseEnterAmount')));
                return;
            }

            // ===== check if recipient have proper TrustLine when delivering IOU =====
            // Note: ignore if sending to the issuer
            if (tx.Amount.currency !== NetworkService.getNativeAsset() && tx.Amount.issuer !== tx.Destination.address) {
                const destinationLine = await LedgerService.getFilteredAccountLine(tx.Destination.address, tx.Amount);

                if (
                    !destinationLine ||
                    (Number(destinationLine.limit) === 0 && Number(destinationLine.balance) === 0)
                ) {
                    reject(new Error(Localize.t('send.unableToSendPaymentRecipientDoesNotHaveTrustLine')));
                    return;
                }
            }

            let NativeAmount = undefined as AmountType;

            // SendMax have higher priority
            if (tx.SendMax && tx.SendMax.currency === NetworkService.getNativeAsset()) {
                NativeAmount = tx.SendMax;
            } else if (tx.Amount.currency === NetworkService.getNativeAsset() && !tx.SendMax) {
                NativeAmount = tx.Amount;
            }

            if (NativeAmount) {
                // ===== check balance =====
                try {
                    // fetch fresh account balance from ledger
                    const availableBalance = await LedgerService.getAccountAvailableBalance(tx.Account.address);

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
                    reject(Localize.t('account.unableGetAccountInfo'));
                    return;
                }
            }

            let IOUAmount = undefined as AmountType;

            // SendMax have higher priority
            if (tx.SendMax && tx.SendMax.currency !== NetworkService.getNativeAsset()) {
                IOUAmount = tx.SendMax;
            } else if (tx.Amount.currency !== NetworkService.getNativeAsset() && !tx.SendMax) {
                IOUAmount = tx.Amount;
            }

            if (IOUAmount) {
                // ===== check balances =====
                // sender is not issuer
                if (IOUAmount.issuer !== tx.Account.address) {
                    // check IOU balance
                    const sourceLine = await LedgerService.getFilteredAccountLine(tx.Account.address, IOUAmount);

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
                    const sourceLine = await LedgerService.getFilteredAccountLine(tx.Account.address, {
                        issuer: tx.Destination.address,
                        currency: IOUAmount.currency,
                    });

                    // TODO: show proper error message
                    if (!sourceLine) {
                        resolve();
                        return;
                    }

                    if (
                        Number(IOUAmount.value) + Math.abs(Number(sourceLine.balance)) >
                        Number(sourceLine.limit_peer)
                    ) {
                        reject(
                            new Error(
                                Localize.t('send.trustLineLimitExceeded', {
                                    balance: Localize.formatNumber(
                                        NormalizeAmount(Math.abs(Number(sourceLine.balance))),
                                    ),
                                    peer_limit: Localize.formatNumber(NormalizeAmount(Number(sourceLine.limit_peer))),
                                    available: Localize.formatNumber(
                                        NormalizeAmount(
                                            Number(
                                                Number(sourceLine.limit_peer) - Math.abs(Number(sourceLine.balance)),
                                            ),
                                        ),
                                    ),
                                }),
                            ),
                        );
                        return;
                    }
                }
            }

            resolve();
        } catch (e) {
            reject(new Error(ErrorMessages.unexpectedValidationError));
        }
    });
};

/* Export ==================================================================== */
export default PaymentValidation;
