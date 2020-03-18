//
//  QRCode.m
//  ZapperReact
//
//  Created by Keiran van Vuuren on 2018/05/30.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "QRCode.h"
#import "UIView+QRCode.h"

@implementation QRCode

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(value, NSString)
RCT_EXPORT_VIEW_PROPERTY(bgColor, NSString)
RCT_EXPORT_VIEW_PROPERTY(fgColor, NSString)
RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)

- (UIImageView *)view
{
    return [[QRCodeView alloc] init];
}

@end
