#import <StoreKit/StoreKit.h>
#import <React/RCTBridgeModule.h>

@interface InAppPurchaseModule : NSObject <RCTBridgeModule, SKProductsRequestDelegate, SKPaymentTransactionObserver>
+ (BOOL)isUserPurchasing;
@end
