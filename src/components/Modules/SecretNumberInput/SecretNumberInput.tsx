/**
 * SecretNumberInput
 *
    <SecretNumberInput />
 *
 */

    import React, { Component } from 'react';
    import { View } from 'react-native';
    
    import { CoreModel } from '@store/models';
    
    import { SecurePinInput } from '@components/General';
    import { CoreRepository } from '@store/repositories';
    
    import { AppStyles } from '@theme';
    
    import SecretNumberRow from './SecretNumberRow';
    
    /* Types ==================================================================== */
    interface Props {
        currentRow?: number;
        currentColumn?: number;
        secretNumbers?: Array<string>;
        readonly?: boolean;
        checksum?: boolean;
        validateRow?: (numbers: string) => boolean;
    }
    
    interface State {
        coreSettings: CoreModel;
        isBiometricAvailable: boolean;
        columnsNumber: number;
        rowsNumber: number;
        currentRow: number;
        currentColumn: number;
        secretNumbers: number[][];
        rowChecksumError: boolean;
    }
    
    /* Constants ==================================================================== */
    const ROWS = 8;
    const COLUMNS = 6;
    const COLUMN_WIHTOUT_CHECKSUM = 5;
    
    /* Component ==================================================================== */
    class SecretNumberInput extends Component<Props, State> {
        declare readonly props: Props & Required<Pick<Props, keyof typeof SecretNumberInput.defaultProps>>;
    
        private securePinInputRef: React.RefObject<SecurePinInput>;
    
        static defaultProps: Partial<Props> = {
            checksum: true,
        };
    
        constructor(props: Props) {
            super(props);
    
            let rows = [...Array(ROWS)].map(() => Array(props.checksum ? COLUMNS : COLUMN_WIHTOUT_CHECKSUM));
            if (props.secretNumbers) {
                rows = [];
                props.secretNumbers.forEach((row) => rows.push(row.split('')));
            }
    
            this.securePinInputRef = React.createRef();
    
            this.state = {
                coreSettings: CoreRepository.getSettings(),
                isBiometricAvailable: false,
                columnsNumber: props.checksum ? COLUMNS : COLUMN_WIHTOUT_CHECKSUM,
                rowsNumber: ROWS,
                currentRow: props.currentRow || 0,
                currentColumn: props.currentColumn || 0,
                secretNumbers: rows,
                rowChecksumError: false,
            };
        }
    
        static getDerivedStateFromProps(props: Props, state: State) {
            if (typeof props.currentRow === 'number') {
                return {
                    ...state,
                    currentRow: props.currentRow,
                };
            }
    
            return state;
        }

        clearPin = () => {
            this.securePinInputRef.current?.setState({
                digits: '',
            });
        };
    
        renderRows = () => {
            const { readonly } = this.props;
            const {
                currentRow,
                currentColumn,
                secretNumbers,
                rowChecksumError,
                rowsNumber,
                columnsNumber,
            } = this.state;
            const rows = [];
    
            for (let i = 0; i < rowsNumber; i++) {
                rows.push(
                    <SecretNumberRow
                        key={`secret-number-row-${i}`}
                        columnsNumber={columnsNumber}
                        numbers={[...secretNumbers[i]]}
                        readonly={readonly}
                        rowNumber={i}
                        currentColumn={currentRow === i ? currentColumn : 0}
                        rowActive={currentRow === i}
                        rowChecksumCorrect={currentRow > i}
                        rowChecksumError={rowChecksumError}
                    />,
                );
            }
            return rows;
        };
    
        onPasscodeEntered = (pin: string) => {
            const { validateRow } = this.props;
            const { currentRow } = this.state;

            if (typeof validateRow === 'function') {
                const validates = validateRow(pin);
                if (validates) {
                    this.setState({
                        currentRow: currentRow + 1,
                    });
                }
            }
        };
    
        render() {
            const { readonly } = this.props;
            const { isBiometricAvailable, coreSettings } = this.state;
    
            if (readonly) {
                return this.renderRows();
            }
    
            return (
                <View style={AppStyles.stretchSelf}>
                    <SecurePinInput
                        ref={this.securePinInputRef}
                        virtualKeyboard
                        onInputFinish={this.onPasscodeEntered}
                        supportBiometric={isBiometricAvailable}
                        enableHapticFeedback={coreSettings.hapticFeedback}
                        length={6}
                    />
                </View>
            );
        }
    }
    
    /* Export Component ==================================================================== */
    export default SecretNumberInput;
    