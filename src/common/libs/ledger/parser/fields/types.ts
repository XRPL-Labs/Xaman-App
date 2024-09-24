import * as Fields from '@common/libs/ledger/parser/fields';
import * as Codecs from '@common/libs/ledger/parser/fields/codec';

type ValuesOf<T extends { [k: string]: unknown }> = T[keyof T];

type UnionOfFields = ValuesOf<typeof Fields>;
type UnionOfCodecs = ValuesOf<typeof Codecs>;

export interface FieldConfig {
    required?: boolean;
    type: UnionOfFields;
    codec?: UnionOfCodecs;
    readonly?: boolean;
}

export interface FieldConfigGeneric extends Omit<FieldConfig, 'type'> {
    type: GenericFieldType;
    codec?: GenericCodecType;
}

export type GenericFieldType = {
    getter: (self: any, name: string) => () => any;
    setter: (self: any, name: string) => (value: any) => void;
};

export type GenericCodecType = {
    decode(self: any, value: any): any;
    encode(self: any, value: any): any;
};

export type FieldReturnType<T, R = unknown> = [R] extends [UnionOfCodecs]
    ? ReturnType<R['decode']>
    : [T] extends [UnionOfFields]
      ? ReturnType<ReturnType<T['getter']>>
      : never;
