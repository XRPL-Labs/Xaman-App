//
//  PayButton+Manager.m
//  Xaman
//
//  Created by XRPL Labs on 07/06/2024.
//

#import "PayButton+Manager.h"
#import "PayButton+View.h"

@implementation PayButtonManager

RCT_EXPORT_MODULE(NativePayButton)

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

- (UIView *) view
{
  return [PayButtonView new];
}

@end
