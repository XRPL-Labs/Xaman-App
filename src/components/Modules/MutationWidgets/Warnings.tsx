import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

import { InfoMessage } from '@components/General';

import Localize from '@locale';

import styles from './styles';

import { Props } from './types';
import { AppStyles } from '@theme/index';
/* Types ==================================================================== */
interface State {}

/* Component ==================================================================== */
class Warnings extends PureComponent<Props, State> {
    render() {
        const { item, account } = this.props;

        const warnings = [] as Array<string>;
        const detailWarnings = [] as Array<string>;

        const c = ((item as any)?.MetaData?.HookExecutions || [])
            ?.filter((h: any) =>
                typeof h === 'object' && h &&
                typeof h?.HookExecution?.HookReturnCode === 'string' &&
                typeof h?.HookExecution?.HookReturnString === 'string',
            )
            ?.map((h: any) => [
                ((val) => val >> 63n ? -(val & ~(1n << 63n)) : val)(BigInt(`0x${String(h.HookExecution.HookReturnCode)}`)),
                Buffer.from(
                    String(h.HookExecution?.HookReturnString || '').replace(/00$/, ''),
                    'hex',
                ).toString('utf-8').trim(),
            ])
            ?.filter((h: any) =>
                h?.[0] !== 0 &&
                String(h?.[1] || '').trim().match(/[a-zA-Z0-9_\-+*^.()[\]:,;!?\s ]+$/msi),
            );  
        
        const tesSUCCESS = (item as any)?.TransactionResult?.code === 'tesSUCCESS'; 

        if (c.length > 0) {
            // warnings.push(Localize.t('errors.tecHOOK_REJECTED_Short').trim());
            detailWarnings.push(c.map((h: string[]) => `${h[1]} (#${h[0]})`).join(', '));
        }

        if (item.Type === LedgerEntryTypes.NFTokenOffer) {
            // incoming offer with destination set other than account
            if (item.Owner !== account.address && item.Destination && item.Destination !== account.address) {
                warnings.push(Localize.t('events.thisOfferCanOnlyBeAcceptedByThirdParty'));
            }
        }

        if (warnings.length > 0 || detailWarnings.length > 0) {
            return (
                <>
                    { warnings.length > 0 && (
                        <View style={styles.warningsContainer}>
                            {warnings.map((warning, index) => {
                                return <InfoMessage key={`warning-${index}`} type="error" label={warning} />;
                            })}
                        </View>
                    )}
                    { detailWarnings.length > 0 && (
                        <View style={styles.detailContainer}>
                            <Text style={[
                                styles.detailsLabelText,
                                tesSUCCESS ? AppStyles.colorGreen : AppStyles.colorRed,
                            ]}>{
                                    tesSUCCESS
                                        ? Localize.t('global.hookExecuted')
                                        : Localize.t('errors.tecHOOK_REJECTED_Short').trim()
                            }</Text>
                            {detailWarnings.map((warning, index) => {
                                return <Text key={`warning-${index}`} style={[
                                    styles.detailsValueText,
                                    tesSUCCESS ? AppStyles.colorGreen : AppStyles.colorRed,
                                ]}>{warning}</Text>;
                            })}
                        </View>
                    )}
                </>
            );
        }

        return null;
    }
}

export default Warnings;
