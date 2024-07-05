//
//  PaymentButtonView.h
//  Xaman
//
//  Created by XRPL Labs on 07/06/2024.
//

#import <React/RCTView.h>
#import <PassKit/PassKit.h>

@interface PayButtonView : RCTView
- (void)initWithPaymentButtonStyle:(NSString *)style;
@property (nonatomic, readonly) PKPaymentButton *button;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (strong, nonatomic) NSString *buttonStyle;
@end
