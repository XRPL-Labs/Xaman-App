/* Field ==================================================================== */
export const UInt64 = {
    getter: (self: any, name: string) => {
        return (): number => {
            return self[name];
        };
    },
    setter: (self: any, name: string) => {
        return (value: number): void => {
            if (typeof value !== 'number') {
                throw new Error(`field ${name} required type number, got ${typeof value}`);
            }

            self[name] = value;
        };
    },
};
