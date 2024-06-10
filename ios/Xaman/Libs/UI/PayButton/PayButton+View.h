//
//  PaymentButtonView.h
//  Xaman
//
//  Created by XRPL Labs on 07/06/2024.
//

#import <React/RCTView.h>
#import <PassKit/PassKit.h>

@interface PayButtonView : RCTView
@property (nonatomic, readonly) PKPaymentButton *button;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@end
