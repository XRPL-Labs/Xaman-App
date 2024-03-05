import Localize from '@locale';

import { ErrorMessages } from '@common/constants';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import NetworkService from '@services/NetworkService';
import LedgerService from '@services/LedgerService';

import CheckCreate from './CheckCreate.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CheckCreateValidation: ValidationType<CheckCreate> = (tx: CheckCreate): Promise<void> => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        try {
            // check if check amount is set
            if (!tx.SendMax || !tx.SendMax?.value || tx.SendMax?.value === '0') {
                reject(new Error(Localize.t('send.pleaseEnterAmount')));
                return;
            }

            // /* check if the Check Amount is exceeding the balance /*
            // Native currency

            if (tx.SendMax.currency === NetworkService.getNativeAsset()) {
                try {
                    // fetch fresh account balance from ledger
                    const availableBalance = await LedgerService.getAccountAvailableBalance(tx.Account);

                    if (Number(tx.SendMax.value) > Number(availableBalance)) {
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
                } catch {
                    reject(Localize.t('account.unableGetAccountInfo'));
                    return;
                }
            }

            // Issued currency
            if (tx.SendMax.issuer && tx.SendMax.currency !== NetworkService.getNativeAsset()) {
                // get TrustLine from ledger
                const line = await LedgerService.getFilteredAccountLine(tx.Account, {
                    issuer: tx.SendMax.issuer,
                    currency: tx.SendMax.currency,
                });

                // check if line exist
                if (line && Number(tx.SendMax.value) > Number(line.balance)) {
                    reject(
                        new Error(
                            Localize.t('send.insufficientBalanceSpendableBalance', {
                                spendable: Localize.formatNumber(Number(line.balance)),
                                currency: NormalizeCurrencyCode(line.currency),
                            }),
                        ),
                    );
                    return;
                }
            }

            // everything seems fine, resolve
            resolve();
        } catch {
            reject(new Error(ErrorMessages.unexpectedValidationError));
        }
    });
};

/* Export ==================================================================== */
export default CheckCreateValidation;
