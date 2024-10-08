/* eslint-disable react/jsx-no-bind */
/**
 * Mnemonic Derivation Path Input
 *
    <DerivationPathInput onChange={} />
 *
 */
import React, { Component } from 'react';
import { View, TextInput, Text, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

import StyleService from '@services/StyleService';

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
    private accountPathInputRef: React.RefObject<TextInput>;
    private changePathInputRef: React.RefObject<TextInput>;
    private addressIndexInputRef: React.RefObject<TextInput>;

    constructor(props: Props) {
        super(props);

        this.state = {
            accountPath: '',
            changePath: '',
            addressIndex: '',
        };

        this.accountPathInputRef = React.createRef();
        this.changePathInputRef = React.createRef();
        this.addressIndexInputRef = React.createRef();
    }

    componentDidMount() {
        const { autoFocus } = this.props;

        if (autoFocus) {
            setTimeout(this.focus, 200);
        }
    }

    focus = () => {
        this.accountPathInputRef?.current?.focus();
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
                this.changePathInputRef?.current?.focus();
            }

            if (type === 'changePath' && changePath === '') {
                this.accountPathInputRef?.current?.focus();
            }
        }
    };

    changeInputFocus = (nextInput: any) => {
        setTimeout(() => {
            if (nextInput) {
                nextInput.focus();
            }
        }, 200);
    };

    render() {
        const { accountPath, changePath, addressIndex } = this.state;

        return (
            <View style={styles.container}>
                <Text style={styles.label}>m/44&apos;/144&apos;/</Text>
                <TextInput
                    ref={this.accountPathInputRef}
                    value={accountPath}
                    style={styles.input}
                    placeholderTextColor={StyleService.value('$lightGrey')}
                    placeholder="0"
                    returnKeyType="next"
                    keyboardType="number-pad"
                    onSubmitEditing={() => {
                        this.changeInputFocus(this.changePathInputRef);
                    }}
                    onChangeText={this.onPathChange.bind(null, 'accountPath')}
                />
                <Text style={styles.label}>&apos;/</Text>
                <TextInput
                    ref={this.changePathInputRef}
                    value={changePath}
                    style={styles.input}
                    placeholderTextColor={StyleService.value('$lightGrey')}
                    placeholder="0"
                    returnKeyType="next"
                    keyboardType="number-pad"
                    onSubmitEditing={() => {
                        this.changeInputFocus(this.addressIndexInputRef);
                    }}
                    onChangeText={this.onPathChange.bind(null, 'changePath')}
                    onKeyPress={this.onKeyPress.bind(null, 'changePath')}
                />
                <Text style={styles.label}>/</Text>
                <TextInput
                    ref={this.addressIndexInputRef}
                    placeholderTextColor={StyleService.value('$lightGrey')}
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
