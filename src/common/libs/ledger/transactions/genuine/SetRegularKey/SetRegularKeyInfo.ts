import Localize from '@locale';

import SetRegularKey from './SetRegularKeyClass';

/* Descriptor ==================================================================== */
const SetRegularKeyInfo = {
    getLabel: (tx: SetRegularKey): string => {
        if (tx.RegularKey) {
            return Localize.t('events.setRegularKey');
        }
        return Localize.t('events.removeRegularKey');
    },

    getDescription: (tx: SetRegularKey): string => {
        let content = Localize.t('events.thisIsAnSetRegularKeyTransaction');
        content += '\n';
        if (tx.RegularKey) {
            content += Localize.t('events.itSetsAccountRegularKeyTo', { regularKey: tx.RegularKey });
        } else {
            content += Localize.t('events.itRemovesTheAccountRegularKey');
        }
        return content;
    },

    getRecipient: (tx: SetRegularKey): { address: string; tag?: number } => {
        if (tx.RegularKey) {
            return { address: tx.RegularKey };
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default SetRegularKeyInfo;
