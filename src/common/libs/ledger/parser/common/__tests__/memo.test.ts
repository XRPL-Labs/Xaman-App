import Memo from '../memo';

describe('Common Parser Memo tx', () => {
    it('Should encode memo', () => {
        // application/x-binary
        const applicationBinary = {
            MemoFormat: '6170706C69636174696F6E2F782D62696E617279',
            MemoType: '5265666572656E6365',
        };
        const applicationBinaryValues = [
            'b41c09f6e287b2c42e3e70195777cf36',
            '7b6a9ea03de70e926ac3896db2128eedffcc3baf',
            'B41C09F6E287B2C42E3E70195777CF36',
        ];
        applicationBinaryValues.forEach((v) => {
            expect(Memo.Encode(v)).toMatchObject(
                Object.assign(applicationBinary, {
                    MemoData: v,
                }),
            );
            expect(Memo.Encode(`0x${v}`)).toMatchObject(
                Object.assign(applicationBinary, {
                    MemoData: v,
                }),
            );
        });

        // text/plains
        expect(Memo.Encode('test 😃')).toMatchObject({
            MemoData: '7465737420F09F9883',
            MemoFormat: '746578742F706C61696E',
            MemoType: '4465736372697074696F6E',
        });
    });

    it('Should decode memo', () => {
        // application/x-binary
        expect(
            Memo.Decode({
                MemoData: 'b41c09f6e287b2c42e3e70195777cf36',
                MemoFormat: '6170706C69636174696F6E2F782D62696E617279',
                MemoType: '5265666572656E6365',
            }),
        ).toMatchObject({
            MemoData: 'b41c09f6e287b2c42e3e70195777cf36',
            MemoFormat: 'application/x-binary',
            MemoType: 'Reference',
        });

        // text/plains
        expect(
            Memo.Decode({
                MemoData: '7465737420F09F9883',
                MemoFormat: '746578742F706C61696E',
                MemoType: '4465736372697074696F6E',
            }),
        ).toMatchObject({
            MemoData: 'test 😃',
            MemoFormat: 'text/plain',
            MemoType: 'Description',
        });
    });
});
