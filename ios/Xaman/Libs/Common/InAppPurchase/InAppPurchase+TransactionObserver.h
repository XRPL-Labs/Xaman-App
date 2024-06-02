//
//  InAppPurchase+TransactionObserver.h
//  Xaman
//
//  Created by XRPL Labs on 02/06/2024.
//

#import <StoreKit/StoreKit.h>

#ifndef InAppPurchase_TransactionObserver_h
#define InAppPurchase_TransactionObserver_h

@interface TransactionObserver: NSObject <SKPaymentTransactionObserver>
@property (nonatomic, copy) void (^completionHandler)(NSArray<NSDictionary *> *purchaseData);
@end

#endif /* InAppPurchase_TransactionObserver_h */
