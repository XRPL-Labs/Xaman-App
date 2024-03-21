/* Field ==================================================================== */
export const Blob = {
    getter: (self: any, name: string) => {
        return (): string => {
            // TODO: try to decode to UTF8 and if it was a valid string then return the string instead of blob
            return self[name];
        };
    },
    setter: (self: any, name: string) => {
        return (value: string): void => {
            if (typeof value === 'undefined') {
                self[name] = undefined;
                return;
            }

            // TODO: valid we are setting hex value
            if (typeof value !== 'string') {
                throw new Error(`field ${name} required type number, got ${typeof value}`);
            }

            self[name] = value;
        };
    },
};
