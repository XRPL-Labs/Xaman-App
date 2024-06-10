//
//  PayButtonView.m
//  Xaman
//
//  Created by XRPL Labs on 07/06/2024.
//

#import <Foundation/Foundation.h>

#import "PayButton+View.h"

@implementation PayButtonView

- (instancetype) init {
  self = [super init];
  
  _button = [[PKPaymentButton alloc] initWithPaymentButtonType:PKPaymentButtonTypeInStore paymentButtonStyle:PKPaymentButtonStyleBlack];
  [_button addTarget:self action:@selector(touchUpInside:) forControlEvents:UIControlEventTouchUpInside];
  
  [self addSubview:_button];
  
  return self;
}

- (void)touchUpInside:(PKPaymentButton *)button {
  if (self.onPress) {
    self.onPress(nil);
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _button.frame = self.bounds;
}

@end
