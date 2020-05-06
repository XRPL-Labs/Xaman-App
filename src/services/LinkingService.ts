/**
 * DeepLink service
 * handle app deep linking
 */

import EventEmitter from 'events';
import { Linking, Alert } from 'react-native';

import { Payload } from '@common/libs/payload';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import NavigationService from '@services/NavigationService';
import LoggerService from '@services/LoggerService';

import Localize from '@locale';

class LinkingService extends EventEmitter {
    singRegex: RegExp;
    txBlobRegex: RegExp;
    logger: any;

    constructor() {
        super();

        this.singRegex = RegExp(
            'https://xumm.app/sign/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
        );

        this.txBlobRegex = RegExp('https://xumm.app/tx/([A-F0-9]{2}){34,}');

        this.logger = LoggerService.createLogger('Linking');
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                // check init notification after moving to default stack
                NavigationService.on('setRoot', async (root: string) => {
                    if (root === 'DefaultStack') {
                        // Listen for deep link as the app is open
                        Linking.addEventListener('url', this.handleDeepLink);

                        // handle if app opens with link
                        Linking.getInitialURL().then(url => {
                            setTimeout(() => {
                                this.handleDeepLink({ url });
                            }, 100);
                        });
                    }
                });

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    handleDeepLink = async ({ url }: { url: string }) => {
        // ignore if the app is not initialized or not url
        if (!url) return;

        // validate the URL
        if (this.singRegex.test(url)) {
            const uuid = /((\w{4,12}-?)){5}/.exec(url)[0];

            Payload.from(uuid)
                .then(payload => {
                    // show review transaction screen
                    Navigator.showModal(
                        AppScreens.Modal.ReviewTransaction,
                        { modalPresentationStyle: 'fullScreen' },
                        {
                            payload,
                        },
                    );
                })
                .catch(e => {
                    Alert.alert(Localize.t('global.error'), e.message);
                    this.logger.error('Cannot fetch payload from backend', url);
                });
        }

        if (this.txBlobRegex.test(url)) {
            const txblob = /([A-F0-9]{2}){34,}/.exec(url)[0];

            Alert.alert(
                Localize.t('global.signedTransaction'),
                Localize.t('global.signedTransactionDetectedSubmit'),
                [
                    {
                        text: Localize.t('global.cancel'),
                    },
                    {
                        text: Localize.t('global.submit'),
                        onPress: async () => {
                            // review the transaction
                            setTimeout(() => {
                                Navigator.showModal(
                                    AppScreens.Modal.Submit,
                                    { modalPresentationStyle: 'fullScreen' },
                                    {
                                        txblob,
                                    },
                                );
                            }, 0);
                        },
                        style: 'default',
                    },
                ],
                { cancelable: false },
            );
        }
    };
}

export default new LinkingService();
