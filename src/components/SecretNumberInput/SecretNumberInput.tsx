/**
 * SecretNumberInput
 *
    <SecretNumberInput />
 *
 */
import React, { Component } from 'react';
import { View, TouchableOpacity, LayoutAnimation } from 'react-native';
import { get, set } from 'lodash';

import { Icon } from '@components';

import { AppStyles } from '@theme';
import styles from './styles';

import SecretNumberRow from './SecretNumberRow';

/* Types ==================================================================== */
interface Props {
    currentRow?: number;
    currentColumn?: number;
    secretNumbers?: Array<string>;
    readonly?: boolean;
    onAllFilled?: (filled: boolean) => void;
}

interface State {
    currentRow: number;
    currentColumn: number;
    secretNumbers: number[][];
    rowChecksumError: boolean;
}

/* Constants ==================================================================== */
const ROWS = 8;
const COLUMNS = 6;

/* Component ==================================================================== */
class SecretNumberInput extends Component<Props, State> {
    allFilled: boolean;

    constructor(props: Props) {
        super(props);

        let rows = [...Array(ROWS)].map(() => Array(COLUMNS));
        if (props.secretNumbers) {
            rows = [];
            props.secretNumbers.forEach(row => rows.push(row.split('')));
        }

        this.state = {
            currentRow: props.currentRow || 0,
            currentColumn: props.currentColumn || 0,
            secretNumbers: rows,
            rowChecksumError: false,
        };

        // set first row/col value if not readonly
        if (!props.readonly) {
            const defaultValue = Math.floor(Math.random() * 9);
            this.setValue(0, 0, defaultValue);
        }

        this.allFilled = false;
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

    public getCurrentRow = (): number => {
        const { currentRow } = this.state;

        return currentRow;
    };

    checkChecksum = (row: number, value: number | string, checksum?: number): Boolean => {
        if (typeof value === 'string') {
            if (value.length !== 6) {
                return false;
            }
            checksum = parseInt(value.slice(5), 10);
            value = parseInt(value.slice(0, 5), 10);
        }
        return (value * (row * 2 + 1)) % 9 === checksum;
    };

    goLeft = () => {
        const { onAllFilled } = this.props;
        const { currentRow, currentColumn } = this.state;
        // we are at first row and column
        if (currentRow === 0 && currentColumn === 0) return;

        if (currentRow !== ROWS) {
            this.setValue(currentRow, currentColumn, undefined, true);
        }
        // go to previous row
        if (currentColumn === 0) {
            this.setState(
                {
                    currentRow: currentRow - 1,
                    currentColumn: COLUMNS - 1,
                    rowChecksumError: false,
                },
                () => {
                    if (currentRow === ROWS) {
                        onAllFilled(false);
                    }
                },
            );
            return;
        }
        // go to previous column
        this.setState({
            currentColumn: currentColumn - 1,
            rowChecksumError: false,
        });
    };

    goRight = () => {
        const { onAllFilled } = this.props;
        const { currentRow, currentColumn, secretNumbers } = this.state;

        // we are after last row
        if (currentRow === ROWS && currentColumn === 0) {
            return;
        }

        // check the checksum and go to next row
        if (currentColumn === COLUMNS - 1) {
            if (this.checkChecksum(currentRow, secretNumbers[currentRow].join(''))) {
                this.setState(
                    {
                        currentRow: currentRow + 1,
                        currentColumn: 0,
                        rowChecksumError: false,
                    },
                    () => {
                        if (currentRow + 1 === ROWS) {
                            onAllFilled(true);
                        }
                    },
                );

                if (currentRow + 1 !== ROWS) {
                    const defaultValue = Math.floor(Math.random() * 9);
                    this.setValue(currentRow + 1, 0, defaultValue, true);
                }
            } else {
                this.setState({
                    rowChecksumError: true,
                });
            }

            return;
        }
        // go to previous column
        this.setState({
            currentColumn: currentColumn + 1,
        });

        const defaultValue = Math.floor(Math.random() * 9);
        this.setValue(currentRow, currentColumn + 1, defaultValue);
    };

    plusValue = () => {
        const { currentRow, currentColumn, secretNumbers } = this.state;

        if (currentRow === ROWS) return;

        const currentValue = get(secretNumbers, `[${currentRow}][${currentColumn}]`);
        if (currentValue + 1 > 9) {
            // loop
            this.setValue(currentRow, currentColumn, 0);
        } else {
            this.setValue(currentRow, currentColumn, currentValue + 1);
        }
    };

    minusValue = () => {
        const { currentRow, currentColumn, secretNumbers } = this.state;

        if (currentRow === ROWS) return;

        const currentValue = get(secretNumbers, `[${currentRow}][${currentColumn}]`);
        if (currentValue - 1 < 0) {
            // loop
            this.setValue(currentRow, currentColumn, 9);
        } else {
            this.setValue(currentRow, currentColumn, currentValue - 1);
        }
    };

    setValue = (row: number, col: number, value: number, newRow?: boolean) => {
        const { secretNumbers } = this.state;

        // animation
        if (newRow) {
            LayoutAnimation.easeInEaseOut();
        } else if (!(row === 0 && col === 0)) {
            LayoutAnimation.spring();
        }

        this.setState({
            secretNumbers: set(secretNumbers, `[${row}][${col}]`, value),
        });
    };

    getNumbers = () => {
        const { secretNumbers } = this.state;
        const secretNumber = [] as string[];
        secretNumbers.forEach(row => secretNumber.push(row.join('')));
        return secretNumber;
    };

    renderRows = () => {
        const { readonly } = this.props;
        const { currentRow, currentColumn, secretNumbers, rowChecksumError } = this.state;
        const rows = [];

        for (let i = 0; i < ROWS; i++) {
            rows.push(
                <SecretNumberRow
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

    render() {
        const { readonly } = this.props;

        if (readonly) {
            return this.renderRows();
        }

        return (
            <View style={AppStyles.stretchSelf}>
                <View style={[]}>{this.renderRows()}</View>
                <View style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingTopSml]}>
                    <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                        <TouchableOpacity activeOpacity={0.8} onPress={this.goLeft} style={[styles.buttonRoundGrey]}>
                            <Icon size={25} name="IconChevronLeft" style={[styles.buttonRoundIcon]} />
                        </TouchableOpacity>
                    </View>

                    <View style={[AppStyles.flex2, AppStyles.row, AppStyles.centerContent, AppStyles.centerAligned]}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={this.minusValue}
                            style={[styles.buttonMiddleLeft]}
                        >
                            <Icon size={30} name="IconMinus" style={[styles.buttonRoundIcon]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={this.plusValue}
                            style={[styles.buttonMiddleRight]}
                        >
                            <Icon size={30} name="IconPlus" style={[styles.buttonRoundIcon]} />
                        </TouchableOpacity>
                    </View>

                    <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                        <TouchableOpacity activeOpacity={0.8} onPress={this.goRight} style={[styles.buttonRoundGrey]}>
                            <Icon size={25} name="IconChevronRight" style={[styles.buttonRoundIcon]} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SecretNumberInput;
