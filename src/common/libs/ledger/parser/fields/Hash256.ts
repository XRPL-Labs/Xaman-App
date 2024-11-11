/* Field ==================================================================== */
export const Hash256 = {
    getter: (self: any, name: string) => {
        return (): string | undefined => {
            return self[name];
        };
    },
    setter: (self: any, name: string) => {
        return (value: string): void => {
            if (typeof value !== 'string') {
                throw new Error(`field ${name} required type string, got ${typeof value}`);
            }

            // TODO: add value check and validation
            self[name] = value;
        };
    },
};
