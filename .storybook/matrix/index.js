/* eslint-disable react-native/no-inline-styles */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import { View } from 'react-native';

const flatMap = (arr, fn) => arr.map(fn).reduce((a, b) => a.concat(b));

const combinations = (variationsByField) => {
    const fieldNames = Object.keys(variationsByField);

    if (!fieldNames.length) return [{}];

    const _combinations = ([fieldName, ...restFieldNames], acc) => {
        const variationsForField = variationsByField[fieldName];

        if (!Array.isArray(variationsForField) || !variationsForField.length) {
            throw new Error(`Please provide a non-empty array of possible values for prop ${fieldName}`);
        }

        const vs = variationsForField.map((fieldValue) => ({ ...acc, [fieldName]: fieldValue }));

        if (!restFieldNames.length) {
            return vs;
        }
        return flatMap(vs, (newAcc) => _combinations(restFieldNames, newAcc));
    };

    return _combinations(fieldNames, {});
};

const createElement = (Component, props) => {
    return (
        <View style={{ marginTop: 10 }} key={Math.random()}>
            {React.createElement(Component, props)}
        </View>
    );
};

export default function withPropsCombinations(component, possibleValuesByPropName) {
    return () => {
        const propsCombinations = combinations(possibleValuesByPropName);

        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {propsCombinations.map((props, i) => createElement(component, { ...props, key: i }))}
            </View>
        );
    };
}
