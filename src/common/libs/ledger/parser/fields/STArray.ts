/* Field ==================================================================== */
export const STArray = {
    getter: (self: any, name: string) => {
        return (): any[] | undefined => {
            const value = self[name];

            if (!value || (Array.isArray(value) && value.length === 0)) {
                return undefined;
            }

            return value;
        };
    },
    setter: (self: any, name: string) => {
        return (value: any[]): void => {
            if (typeof value === 'undefined') {
                self[name] = undefined;
                return;
            }

            if (!Array.isArray(value)) {
                throw new Error(`field ${name} required type array, got ${typeof value}`);
            }

            self[name] = value;
        };
    },
};
