/* eslint-disable react/jsx-no-bind */
/**
 * Mnemonic Derivation Path Input
 *
    <DerivationPathInput onChange={} />
 *
 */
import React, { Component } from 'react';
import { View, TextInput, Text, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

import styles from './styles';
/* Types ==================================================================== */
interface PathObjectType {
    accountPath?: string;
    changePath?: string;
    addressIndex?: string;
}

interface Props {
    autoFocus?: boolean;
    onChange?: (path: PathObjectType) => void;
}

interface State extends PathObjectType {}
/* Component ==================================================================== */
class DerivationPathInput extends Component<Props, State> {
    private accountPathInput: TextInput;
    private changePathInput: TextInput;
    private addressIndexInput: TextInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            accountPath: '',
            changePath: '',
            addressIndex: '',
        };
    }

    componentDidMount() {
        const { autoFocus } = this.props;

        if (autoFocus) {
            this.focus();
        }
    }

    focus = () => {
        if (this.accountPathInput) {
            this.accountPathInput.focus();
        }
    };

    onChangeCallback = () => {
        const { onChange } = this.props;
        const { accountPath, changePath, addressIndex } = this.state;

        if (typeof onChange === 'function') {
            onChange({
                accountPath,
                changePath,
                addressIndex,
            });
        }
    };

    onPathChange = (type: string, content: string) => {
        const clearIndex = content.replace(/[^0-9]/g, '');

        this.setState(
            {
                [type]: clearIndex,
            },
            this.onChangeCallback,
        );
    };

    onKeyPress = (type: string, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        const { changePath, addressIndex } = this.state;

        if (e.nativeEvent.key === 'Backspace') {
            if (type === 'addressIndex' && addressIndex === '') {
                if (this.changePathInput) {
                    this.changePathInput.focus();
                }
            }

            if (type === 'changePath' && changePath === '') {
                if (this.accountPathInput) {
                    this.accountPathInput.focus();
                }
            }
        }
    };

    render() {
        const { accountPath, changePath, addressIndex } = this.state;

        return (
            <View style={[styles.container]}>
                <Text style={styles.label}>m/44&apos;/144&apos;/</Text>
                <TextInput
                    ref={(r) => {
                        this.accountPathInput = r;
                    }}
                    value={accountPath}
                    style={styles.input}
                    placeholder="0"
                    returnKeyType="next"
                    keyboardType="number-pad"
                    onSubmitEditing={() => {
                        if (this.changePathInput) {
                            this.changePathInput.focus();
                        }
                    }}
                    onChangeText={this.onPathChange.bind(null, 'accountPath')}
                />
                <Text style={styles.label}>&apos;/</Text>
                <TextInput
                    ref={(r) => {
                        this.changePathInput = r;
                    }}
                    value={changePath}
                    style={styles.input}
                    placeholder="0"
                    returnKeyType="next"
                    keyboardType="number-pad"
                    onSubmitEditing={() => {
                        if (this.addressIndexInput) {
                            this.addressIndexInput.focus();
                        }
                    }}
                    onChangeText={this.onPathChange.bind(null, 'changePath')}
                    onKeyPress={this.onKeyPress.bind(null, 'changePath')}
                />
                <Text style={styles.label}>/</Text>
                <TextInput
                    ref={(r) => {
                        this.addressIndexInput = r;
                    }}
                    value={addressIndex}
                    returnKeyType="done"
                    keyboardType="number-pad"
                    style={styles.input}
                    placeholder="0"
                    onChangeText={this.onPathChange.bind(null, 'addressIndex')}
                    onKeyPress={this.onKeyPress.bind(null, 'addressIndex')}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default DerivationPathInput;
