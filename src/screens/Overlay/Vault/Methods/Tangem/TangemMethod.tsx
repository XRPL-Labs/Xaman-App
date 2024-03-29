/**
 * Vault / Tangem Method
 */

import React, { Component } from 'react';
import { InteractionManager } from 'react-native';
import { Card } from 'tangem-sdk-react-native';

import { MethodsContext } from '../../Context';
import { AuthMethods } from '../../types';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class TangemMethod extends Component<Props, State> {
    static contextType = MethodsContext;
    context: React.ContextType<typeof MethodsContext>;

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.startAuthentication);
    }

    startAuthentication = () => {
        const { sign, preferredSigner } = this.context;

        if (!preferredSigner) {
            return;
        }

        const tangemCard = preferredSigner.additionalInfo as Card;

        sign(AuthMethods.TANGEM, { tangemCard });
    };

    // @ts-ignore
    render() {
        // this method doesn't render anything
        return null;
    }
}

/* Export Component ==================================================================== */
export default TangemMethod;
