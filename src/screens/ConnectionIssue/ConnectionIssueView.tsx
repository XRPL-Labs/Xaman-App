/**
 * Connection Issue Screen
 */
import { last, remove } from 'lodash';
import React, { Component } from 'react';
import { Text, Image, SafeAreaView, View, Alert } from 'react-native';

import { Images } from '@common/helpers/images';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

// constants
import { AppScreens, AppConfig } from '@common/constants';
// locale
import Localize from '@locale';

// component
import { Button, Spacer, Footer } from '@components';

import { CoreRepository } from '@store/repositories';
import { NodeChain } from '@store/types';

import { SocketService } from '@services';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isConnecting: boolean;
    retryCount: number;
    currentNode: string;
}

/* Component ==================================================================== */
class ConnectionIssueView extends Component<Props, State> {
    static screenName = AppScreens.ConnectionIssue;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isConnecting: false,
            retryCount: 0,
            currentNode: '',
        };
    }

    componentDidMount() {
        // on socket connect
        SocketService.once('connect', () => {
            Navigator.startDefault();
        });

        // set current node
        const defaultNode = CoreRepository.getDefaultNode();
        this.setState({
            currentNode: defaultNode.node,
        });
    }

    switchNode = () => {
        // FIXME: this will fail in case of more than defined node
        const defaultNode = CoreRepository.getDefaultNode();
        // check if node is verified/custom

        let nodes = Array.from(AppConfig.nodes.main);

        // check connected node type
        if (defaultNode.chain === NodeChain.Test) {
            nodes = Array.from(AppConfig.nodes.test);
        }

        // choose the new node
        const newNode = last(remove(nodes, n => n !== defaultNode.node));

        // change the default node in the store
        CoreRepository.saveSettings({
            defaultNode: newNode,
        });

        // set the default node in the socket service
        SocketService.setDefaultNode(newNode);

        // try to reconnect to the new node
        this.setState(
            {
                retryCount: 0,
            },
            () => {
                this.retryConnection(true);
            },
        );
    };

    retryConnection = (differentNode?: boolean) => {
        const { isConnecting, retryCount, currentNode } = this.state;

        if (isConnecting) return;

        this.setState({
            isConnecting: true,
        });

        SocketService.reconnect()
            .catch(() => {
                this.setState({
                    isConnecting: false,
                    retryCount: retryCount + 1,
                    currentNode: SocketService.node,
                });

                if (differentNode) {
                    Alert.alert(
                        Localize.t('global.pleaseNote'),
                        Localize.t('global.WeWillKeepTryingButThereMayBeAProblemWithYourInternetConnection'),
                    );
                } else {
                    Toast(Localize.t('global.UnableToConnectToNode', { defaultNode: currentNode }));
                }
            })
            .finally(() => {
                this.setState({
                    isConnecting: false,
                });
            });
    };

    render() {
        const { currentNode, isConnecting, retryCount } = this.state;

        return (
            <SafeAreaView style={[AppStyles.container]}>
                <View style={[AppStyles.flex2, AppStyles.centerContent]}>
                    <Image style={styles.logo} source={Images.xummLogo} />
                </View>
                <View style={[AppStyles.flex8, AppStyles.paddingSml]}>
                    <View style={[AppStyles.flex4, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImageCloudAlert} />
                    </View>

                    <View style={[AppStyles.flex2, AppStyles.centerAligned]}>
                        <Text style={[AppStyles.h5, AppStyles.strong]}>{Localize.t('global.noConnection')}</Text>
                        <Spacer size={30} />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('global.thereIsNoConnectionToTheCurrentXRPLNode')}
                            {'  '}&apos;
                            <Text style={[AppStyles.monoBold, AppStyles.textCenterAligned]}>{currentNode}</Text>
                            &apos;
                        </Text>
                    </View>
                </View>
                <Footer>
                    <Button
                        onPress={this.retryConnection}
                        isLoading={isConnecting}
                        testID="retry-connection-button"
                        label="Retry connection"
                    />

                    {retryCount >= 2 && (
                        <>
                            <Spacer size={20} />
                            <Button
                                onPress={this.switchNode}
                                secondary
                                testID="try-different-node-button"
                                label="Try a different node"
                            />
                        </>
                    )}
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ConnectionIssueView;
