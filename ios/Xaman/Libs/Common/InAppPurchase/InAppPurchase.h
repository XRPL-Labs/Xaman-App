#import <StoreKit/StoreKit.h>
#import <React/RCTBridgeModule.h>

@interface InAppPurchaseModule : NSObject <RCTBridgeModule>
-(void)launchBillingFlow:(SKProduct *) productDetails
               resolver:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject;
+ (BOOL)isUserPurchasing;
@end
