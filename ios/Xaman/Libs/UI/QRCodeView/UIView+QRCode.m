//
//  UIView+QRCode.m
//  ZapperReact
//
//  Created by Keiran van Vuuren on 2018/05/30.
//  Copyright © 2018 Zapper. All rights reserved.
//

#import "UIView+QRCode.h"
#import "QRCodeGenerator.h"

@implementation QRCodeView

- (void)setValue:(NSString *)value {
    _value = value;
    [self generateImage];
}

- (void)setSize:(NSNumber *)value {
    _size = value;
    [self generateImage];
}

- (void)setBgColor:(NSString *)value {
    _bgColor = value;
    [self generateImage];
}

- (void)setFgColor:(NSString *)value {
    _fgColor = value;
    [self generateImage];
}

- (void)generateImage {
    if (![_value isEqualToString:@""]) {
        QRCodeGenerator *qr = [[QRCodeGenerator alloc] initWithString: self.value];
        qr.size = CGSizeMake([_size doubleValue], [_size doubleValue]);
        if (_fgColor != nil){
            qr.color = [CIColor colorWithRGBA:_fgColor];
        }
        if (_bgColor != nil){
            qr.backgroundColor = [CIColor colorWithRGBA:_bgColor];
        }
        [self setImage:[qr getImage]];
    }
}


@end
