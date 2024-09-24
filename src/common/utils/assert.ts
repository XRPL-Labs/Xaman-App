/**
 * Check if a value is required and throw an error if it is missing or empty.
 *
 * @param {any} value - The value to check.
 * @param {boolean} required - required indicator
 * @param {string} message - The error message.
 *
 * @throws {Error} If the required value is missing or empty.
 */
const assertRequired = (value: any, required: boolean, message: string): void => {
    if (
        required === true &&
        (value === null ||
            value === undefined ||
            value === '' ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0))
    ) {
        throw new Error(message);
    }
};

/**
 * Check if a value is true and throw an error if it is not.
 *
 * @param {unknown} value - The value to check.
 * @param {string} message - The error message.
 *
 * @throws {Error} If the value is not true.
 */
const assertTrue = (value: unknown, message: string): void => {
    if (value === true) {
        throw new Error(message);
    }
};

export { assertRequired, assertTrue };
