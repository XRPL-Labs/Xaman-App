//
//  PayButtonView.m
//  Xaman
//
//  Created by XRPL Labs on 07/06/2024.
//

#import <Foundation/Foundation.h>

#import "PayButton+View.h"

NSString * const DEFAULT_BUTTON_STYLE = @"dark";

@implementation PayButtonView

@synthesize buttonStyle = _buttonStyle;

- (instancetype) init {
  self = [super init];
  
  [self initWithPaymentButtonStyle:DEFAULT_BUTTON_STYLE];
  
  return self;
}

- (void)initWithPaymentButtonStyle:(NSString *) value {
  if (_buttonStyle != value) {
    
    PKPaymentButtonStyle style;
    
    if ([value isEqualToString: @"light"]) {
      style = PKPaymentButtonStyleWhiteOutline;
    } else {
      style = PKPaymentButtonStyleBlack;
    }
    
    
    _button = [[PKPaymentButton alloc] initWithPaymentButtonType:PKPaymentButtonTypePlain paymentButtonStyle:style];
    [_button addTarget:self action:@selector(touchUpInside:)forControlEvents:UIControlEventTouchUpInside];

    [super setFrame:_button.frame];
    [self addSubview:_button];
  }

  
  _buttonStyle = value;
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
