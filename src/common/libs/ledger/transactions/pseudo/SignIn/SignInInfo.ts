import Localize from '@locale';

/* Descriptor ==================================================================== */
const SignInInfo = {
    getLabel: (): string => {
        return Localize.t('global.signIn');
    },

    getDescription: (): string => {
        throw new Error('SignIn Pseudo transactions do not contain description!');
    },

    getRecipient: () => {
        throw new Error('SignIn Pseudo transactions do not contain recipient!');
    },
};

/* Export ==================================================================== */
export default SignInInfo;
