/* Field ==================================================================== */
export const STObject = {
    getter: (self: any, name: string) => {
        return (): Record<string, any> | undefined => {
            const value = self[name];

            if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
                return undefined;
            }

            return value;
        };
    },
    setter: (self: any, name: string) => {
        return (value: Record<string, any>): void => {
            if (typeof value === 'undefined') {
                self[name] = undefined;
                return;
            }

            if (typeof value !== 'object') {
                throw new Error(`field ${name} required type object, got ${typeof value}`);
            }

            self[name] = value;
        };
    },
};
