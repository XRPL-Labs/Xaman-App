import Localize from '@locale';

import { AccountModel } from '@store/models';

import SignIn from './SignIn.class';
/* Types ==================================================================== */
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class SignInInfo extends ExplainerAbstract<SignIn> {
    constructor(item: SignIn, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('global.signIn');
    }

    generateDescription(): never {
        throw new Error('SignIn Pseudo transaction do not contain description!');
    }

    getParticipants(): never {
        throw new Error('SignIn Pseudo transaction do not contain participants!');
    }

    getMonetaryDetails(): never {
        throw new Error('SignIn Pseudo transaction do not contain monetary details!');
    }
}

/* Export ==================================================================== */
export default SignInInfo;
