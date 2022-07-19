//
//  UIView+QRCode.h
//  ZapperReact
//
//  Created by Keiran van Vuuren on 2018/05/30.
//  Copyright © 2018 Zapper. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface QRCodeView : UIImageView

@property (nonatomic, strong) NSString *value;
@property (nonatomic, strong) NSString *bgColor;
@property (nonatomic, strong) NSString *fgColor;
@property (nonatomic, strong) NSNumber *size;

@end
