/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { NODE_ENV } = process.env;

const invariant = (condition: any, format: string, ...args: any[]) => {
    if (NODE_ENV !== 'production') {
        if (format === undefined) {
            throw new Error('invariant requires an error message argument');
        }
    }

    if (!condition) {
        let error: any;
        if (format === undefined) {
            error = new Error(
                'Minified exception occurred; use the non-minified dev environment ' +
                    'for the full error message and additional helpful warnings.',
            );
        } else {
            let argIndex = 0;
            error = new Error(
                format.replace(/%s/g, () => {
                    return args[argIndex++];
                }),
            );
            error.name = 'Invariant Violation';
        }

        error.framesToPop = 1; // we don't care about invariant's own frame
        throw error;
    }
};

export default invariant;
