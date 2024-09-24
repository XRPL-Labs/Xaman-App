//
//  InAppPurchase+ProductRequestHandler.h
//  Xaman
//
//  Created by XRPL Labs on 02/06/2024.
//

#import <StoreKit/StoreKit.h>

#ifndef InAppPurchase_ProductRequestHandler_h
#define InAppPurchase_ProductRequestHandler_h

@interface ProductRequestHandler: NSObject <SKProductsRequestDelegate>
@property (nonatomic, copy) void (^completionHandler)(BOOL didSucceed, NSArray <SKProduct*> *products, NSError *error);
- (void)startProductRequestForIdentifier:(NSString *)productId;
@end

#endif /* InAppPurchase_ProductRequestHandler_h */

