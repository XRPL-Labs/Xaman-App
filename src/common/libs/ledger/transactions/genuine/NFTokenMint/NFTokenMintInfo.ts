import Localize from '@locale';

import NFTokenMint from './NFTokenMintClass';

/* Descriptor ==================================================================== */
const NFTokenMintInfo = {
    getLabel: (): string => {
        return Localize.t('events.mintNFT');
    },

    getDescription: (tx: NFTokenMint): string => {
        let content = '';

        content += Localize.t('events.theTokenIdIs', { tokenID: tx.NFTokenID });

        if (tx.TransferFee) {
            content += '\n';
            content += Localize.t('events.theTokenHasATransferFee', { transferFee: tx.TransferFee });
        }

        if (tx.NFTokenTaxon) {
            content += '\n';
            content += Localize.t('events.theTokenTaxonForThisTokenIs', { taxon: tx.NFTokenTaxon });
        }

        return content;
    },

    getRecipient: (tx: NFTokenMint): { address: string; tag?: number } => {
        if (tx.Issuer) {
            return { address: tx.Issuer };
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default NFTokenMintInfo;
