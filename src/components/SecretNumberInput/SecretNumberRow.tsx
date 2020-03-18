/**
 * SecretNumberRow
 *
 */
import { isEqual, get } from 'lodash';
import React, { Component } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';

import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    rowNumber: number;
    rowActive: boolean;
    currentColumn: number;
    numbers?: Array<number>;
    rowChecksumError?: boolean;
    rowChecksumCorrect?: boolean;
    readonly?: boolean;
}

interface State {}

/* Constants ==================================================================== */
const COLUMNS = 6;

/* Component ==================================================================== */
class SecretNumberRow extends Component<Props, State> {
    rowAnimatedValue: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.rowAnimatedValue = new Animated.Value(0);
    }

    shouldComponentUpdate(nextProps: Props) {
        const { numbers, rowChecksumError, rowChecksumCorrect, currentColumn, rowActive } = this.props;

        return (
            !isEqual(nextProps.currentColumn, currentColumn) ||
            !isEqual(nextProps.numbers, numbers) ||
            !isEqual(nextProps.rowChecksumError, rowChecksumError) ||
            !isEqual(nextProps.rowChecksumCorrect, rowChecksumCorrect) ||
            !isEqual(nextProps.rowActive, rowActive)
        );
    }

    renderColumns = () => {
        const { numbers, currentColumn, rowChecksumError, readonly } = this.props;

        const columns = [];

        for (let i = 0; i < COLUMNS; i++) {
            const colActive = i === currentColumn;

            const value = get(numbers, `[${i}]`, false);

            columns.push(
                i === 0 || i === 6 ? null : (
                    <View
                        key={`${i}_separator`}
                        style={[
                            styles.separator,
                            rowChecksumError && { backgroundColor: AppColors.red },
                            readonly && { backgroundColor: AppColors.orange },
                        ]}
                    />
                ),
                <TouchableOpacity
                    key={`${i}`}
                    style={[
                        styles.inputBox,
                        colActive && !readonly && styles.inputBoxActive,
                        styles.inputBoxRowActive,
                        rowChecksumError && styles.inputBoxActiveError,
                    ]}
                >
                    <Text
                        style={[
                            styles.inputText,
                            styles.inputTextActive,
                            readonly && { color: AppColors.orange },
                            rowChecksumError && styles.inputTextError,
                        ]}
                    >
                        {value}
                    </Text>
                </TouchableOpacity>,
            );
        }
        return columns;
    };

    render() {
        const { rowChecksumError, rowChecksumCorrect, rowActive, rowNumber, readonly } = this.props;

        const abcdefgh = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        const animatedStyle = {
            transform: [
                {
                    translateY: this.rowAnimatedValue.interpolate({
                        inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                        outputRange: [0, 10, -15, 12, -9, 18, -7, 10, -11, 5, 0],
                    }),
                },
                {
                    translateX: this.rowAnimatedValue.interpolate({
                        inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                        outputRange: [0, 2, -3, 4, -4, 3, -3, 4, -5, 2, 0],
                    }),
                },
            ],
        };

        if (!rowActive) {
            return (
                <View
                    style={[
                        styles.rowStyle,
                        AppStyles.centerContent,
                        AppStyles.centerAligned,
                        { backgroundColor: rowChecksumCorrect && !readonly ? AppColors.green : AppColors.grey },
                    ]}
                >
                    <Text
                        style={[
                            styles.RowId,
                            rowChecksumCorrect && !readonly ? AppStyles.colorWhite : AppStyles.colorBlack,
                        ]}
                    >
                        {abcdefgh[rowNumber]}
                    </Text>
                </View>
            );
        }

        return (
            <>
                <Text
                    style={[
                        styles.rowStyleActiveId,
                        { backgroundColor: !readonly ? AppColors.blue : AppColors.orange },
                    ]}
                >
                    {abcdefgh[rowNumber]}
                </Text>
                <View style={[styles.rowStyle, styles.rowStyleActive]}>
                    <Animated.View
                        style={[
                            AppStyles.row,
                            AppStyles.flex1,
                            animatedStyle,
                            styles.rowStyleInnerActive,
                            readonly && { backgroundColor: AppColors.lightOrange },
                            rowChecksumError && styles.rowStyleInnerError,
                        ]}
                    >
                        {this.renderColumns()}
                    </Animated.View>
                    {/* <View style={styles.RowIdActiveContainer}>
                    <Text style={[styles.RowId, rowActive && styles.RowIdActive]}>{abcdefgh[rowNumber]}</Text>
                </View> */}
                </View>
            </>
        );
    }
}

/* Export Component ==================================================================== */
export default SecretNumberRow;
