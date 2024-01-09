/* eslint-disable spellcheck/spell-checker */

/* Constants ==================================================================== */
const LedgerObjectFlags = {
    RippleState: {
        lsfLowReserve: 0x00010000,
        lsfHighReserve: 0x00020000,
        lsfLowNoRipple: 0x00100000,
        lsfHighNoRipple: 0x00200000,
    },
    SignerList: {
        lsfOneOwnerCount: 0x00010000,
    },
};

export { LedgerObjectFlags };
