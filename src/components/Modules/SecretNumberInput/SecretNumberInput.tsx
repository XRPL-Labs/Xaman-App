/**
 * SecretNumberInput
 *
    <SecretNumberInput />
 *
 */

import { get, set } from 'lodash';

import React, { Component } from 'react';
import { View, TouchableOpacity, LayoutAnimation } from 'react-native';

import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

import SecretNumberRow from './SecretNumberRow';

/* Types ==================================================================== */
interface Props {
    currentRow?: number;
    currentColumn?: number;
    secretNumbers?: Array<string>;
    readonly?: boolean;
    checksum?: boolean;
    onRowChanged?: (row: number) => void;
    onAllFilled?: (filled: boolean) => void;
    validateRow?: (row: number, numbers: string) => boolean;
}

interface State {
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
    allFilled: boolean;

    static defaultProps = {
        checksum: true,
    };

    constructor(props: Props) {
        super(props);

        let rows = [...Array(ROWS)].map(() => Array(props.checksum ? COLUMNS : COLUMN_WIHTOUT_CHECKSUM));
        if (props.secretNumbers) {
            rows = [];
            props.secretNumbers.forEach((row) => rows.push(row.split('')));
        }

        this.state = {
            columnsNumber: props.checksum ? COLUMNS : COLUMN_WIHTOUT_CHECKSUM,
            rowsNumber: ROWS,
            currentRow: props.currentRow || 0,
            currentColumn: props.currentColumn || 0,
            secretNumbers: rows,
            rowChecksumError: false,
        };

        this.allFilled = false;
    }

    componentDidMount() {
        const { readonly } = this.props;
        // set first row/col value if not readonly
        if (!readonly) {
            const defaultValue = Math.floor(Math.random() * 9);
            this.setValue(0, 0, defaultValue);
        }
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

    checkChecksum = (row: number, numbers: string): Boolean => {
        const { validateRow, checksum } = this.props;
        const { columnsNumber } = this.state;

        // ignore checking for checksum if checksum in the props
        if (!checksum) {
            // if any custom row validation
            if (typeof validateRow === 'function') {
                return validateRow(row, numbers);
            }
            return true;
        }

        if (numbers.length !== columnsNumber) {
            return false;
        }

        const calculatedChecksum = parseInt(numbers.slice(5), 10);
        const value = parseInt(numbers.slice(0, 5), 10);

        const validChecksum = (value * (row * 2 + 1)) % 9 === calculatedChecksum;

        // if any custom row validation
        if (typeof validateRow === 'function') {
            return validateRow(row, numbers) && validChecksum;
        }
        return validChecksum;
    };

    goLeft = () => {
        const { onAllFilled, onRowChanged } = this.props;
        const { currentRow, currentColumn, columnsNumber, rowsNumber } = this.state;
        // we are at first row and column
        if (currentRow === 0 && currentColumn === 0) return;

        if (currentRow !== rowsNumber) {
            this.setValue(currentRow, currentColumn, undefined, true);
        }
        // go to previous row
        if (currentColumn === 0) {
            this.setState(
                {
                    currentRow: currentRow - 1,
                    currentColumn: columnsNumber - 1,
                    rowChecksumError: false,
                },
                () => {
                    if (onRowChanged) {
                        onRowChanged(currentRow - 1);
                    }
                    if (currentRow === rowsNumber) {
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
        const { onAllFilled, onRowChanged } = this.props;
        const { currentRow, currentColumn, secretNumbers, rowsNumber, columnsNumber } = this.state;

        // we are after last row
        if (currentRow === rowsNumber && currentColumn === 0) {
            return;
        }

        // check the checksum and go to next row
        if (currentColumn === columnsNumber - 1) {
            if (this.checkChecksum(currentRow, secretNumbers[currentRow].join(''))) {
                this.setState(
                    {
                        currentRow: currentRow + 1,
                        currentColumn: 0,
                        rowChecksumError: false,
                    },
                    () => {
                        if (onRowChanged) {
                            onRowChanged(currentRow + 1);
                        }
                        if (currentRow + 1 === rowsNumber) {
                            onAllFilled(true);
                        }
                    },
                );

                if (currentRow + 1 !== rowsNumber) {
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
        const { currentRow, currentColumn, secretNumbers, rowsNumber } = this.state;

        if (currentRow === rowsNumber) return;

        const currentValue = get(secretNumbers, `[${currentRow}][${currentColumn}]`);
        if (currentValue + 1 > 9) {
            // loop
            this.setValue(currentRow, currentColumn, 0);
        } else {
            this.setValue(currentRow, currentColumn, currentValue + 1);
        }
    };

    minusValue = () => {
        const { currentRow, currentColumn, secretNumbers, rowsNumber } = this.state;

        if (currentRow === rowsNumber) return;

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
        secretNumbers.forEach((row) => secretNumber.push(row.join('')));
        return secretNumber;
    };

    renderRows = () => {
        const { readonly } = this.props;
        const { currentRow, currentColumn, secretNumbers, rowChecksumError, rowsNumber, columnsNumber } = this.state;
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
                        <TouchableOpacity
                            testID="left-btn"
                            activeOpacity={0.8}
                            onPress={this.goLeft}
                            style={[styles.buttonRoundBlack]}
                        >
                            <Icon size={25} name="IconChevronLeft" style={[styles.buttonRoundIcon]} />
                        </TouchableOpacity>
                    </View>

                    <View style={[AppStyles.flex2, AppStyles.row, AppStyles.centerContent, AppStyles.centerAligned]}>
                        <TouchableOpacity
                            testID="minus-btn"
                            activeOpacity={0.8}
                            onPress={this.minusValue}
                            style={[styles.buttonMiddleLeft]}
                        >
                            <Icon size={30} name="IconMinus" style={[styles.buttonRoundIcon]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            testID="plus-btn"
                            activeOpacity={0.8}
                            onPress={this.plusValue}
                            style={[styles.buttonMiddleRight]}
                        >
                            <Icon size={30} name="IconPlus" style={[styles.buttonRoundIcon]} />
                        </TouchableOpacity>
                    </View>

                    <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                        <TouchableOpacity
                            testID="right-btn"
                            activeOpacity={0.8}
                            onPress={this.goRight}
                            style={[styles.buttonRoundBlack]}
                        >
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
