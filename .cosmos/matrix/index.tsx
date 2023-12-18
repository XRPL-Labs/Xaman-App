import React, { ReactNode } from 'react';
import { View } from 'react-native';

type VariationsByField = {
    [key: string]: any[];
};

type CreatedElementProps = {
    [key: string]: any;
};

const flatMap = (arr: any[], fn: (item: any) => any[]): any[] => arr.map(fn).reduce((a, b) => a.concat(b), []);

const combinations = (variationsByField: VariationsByField): CreatedElementProps[] => {
    const fieldNames = Object.keys(variationsByField);

    if (!fieldNames.length) return [{}];

    const _combinations = (fieldNamesList: string[], acc: CreatedElementProps): CreatedElementProps[] => {
        const fieldName = fieldNamesList[0];
        const restFieldNames = fieldNamesList.slice(1);

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

const createElement = (Component: any, props: CreatedElementProps): ReactNode => {
    return (
        <View style={{ marginTop: 10, alignSelf: 'stretch' }} key={Math.random().toString()}>
            {React.createElement(Component, props)}
        </View>
    );
};

const withPropsCombinations = (component: any, possibleValuesByPropName: VariationsByField) => {
    const propsCombinations = combinations(possibleValuesByPropName);

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'stretch',
            }}
        >
            {propsCombinations.map((props, i) => createElement(component, { ...props, key: i }))}
        </View>
    );
};

export default withPropsCombinations;
