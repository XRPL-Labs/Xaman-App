//
//  InAppPurchase+TransactionObserver.m
//  Xaman
//
//  Created by XRPL Labs on 02/06/2024.
//

#import <Foundation/Foundation.h>

#import "InAppPurchase+TransactionObserver.h"

@implementation TransactionObserver

- (void)paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue
{
  NSMutableArray *result=[self transactionsToResult:queue.transactions];
  [self callCompletionHandlerWithResult:result];
}

- (void)paymentQueue:(SKPaymentQueue *)queue restoreCompletedTransactionsFailedWithError:(NSError *)error
{
  // No purchase history, just return an empty result
  [self callCompletionHandlerWithResult:[[NSMutableArray alloc] init]];
}

- (void)paymentQueue: (nonnull SKPaymentQueue *)queue
  updatedTransactions: (nonnull NSArray<SKPaymentTransaction *> *)transactions {
  NSMutableArray *result=[self transactionsToResult:transactions];
  if([result count] > 0){
    [self callCompletionHandlerWithResult:result];
  }
}

- (void)callCompletionHandlerWithResult: (NSMutableArray *)result {
  if (self.completionHandler) {
    self.completionHandler(result);
    self.completionHandler = nil;
  }else{
    @throw [NSException exceptionWithName:@"TransactionObserver" reason:@"no completion found?" userInfo:nil];
  }
}

- (NSMutableArray *)transactionsToResult: (nonnull NSArray<SKPaymentTransaction *> *)transactions {
  NSMutableArray *result = [NSMutableArray arrayWithCapacity: [transactions count]];

  [transactions enumerateObjectsUsingBlock: ^(SKPaymentTransaction *obj, NSUInteger idx, BOOL *stop) {
    NSMutableDictionary *paymentDictionary = [[NSMutableDictionary alloc] init];

    NSString *productIdentifier = obj.payment.productIdentifier;
    NSString *transactionIdentifier = obj.transactionIdentifier;
    NSString *applicationUsername = obj.payment.applicationUsername;
    NSNumber *quantity = [NSNumber numberWithInteger:obj.payment.quantity];

    [paymentDictionary setValue:productIdentifier forKey:@"productIdentifier"];
    [paymentDictionary setValue:transactionIdentifier forKey:@"transactionIdentifier"];
    [paymentDictionary setValue:applicationUsername forKey:@"applicationUsername"];
    [paymentDictionary setValue:quantity forKey:@"quantity"];

    switch(obj.transactionState){
        // SUCCESS
      case SKPaymentTransactionStatePurchased:
      case SKPaymentTransactionStateRestored:
      {
        NSString *receipt = [[NSData dataWithContentsOfURL:[[NSBundle mainBundle] appStoreReceiptURL]] base64EncodedStringWithOptions:0];
        [paymentDictionary setValue:receipt forKey:@"receipt"];
        break;
      }
        // FAILED
      case SKPaymentTransactionStateFailed:
      {
        NSString *humanErrorMessage = [self normalizeStoreKitError:obj.error];
        [paymentDictionary setValue:humanErrorMessage forKey:@"error"];
        // just finish the transaction, otherwise it will not being cleared.
        [[SKPaymentQueue defaultQueue] finishTransaction:obj];
        break;
      }
        // NO ACTION IS NEEDED
      case SKPaymentTransactionStatePurchasing:
      case SKPaymentTransactionStateDeferred:
        return;
    }

    [result addObject: paymentDictionary];
  }];


  return result;
}


-(NSString*)normalizeStoreKitError:(NSError *)error {
  switch (error.code) {
    case SKErrorUnknown:
      return @"Unknown error occurred. Please try again.";
    case SKErrorClientInvalid:
      return @"In-app purchases are not allowed on this device.";
    case SKErrorPaymentCancelled:
      return @"You have cancelled the transaction.";
    case SKErrorPaymentInvalid:
      return @"The purchase identifier is invalid.";
    case SKErrorPaymentNotAllowed:
      return @"You are not authorized to make purchases.";
    case SKErrorStoreProductNotAvailable:
      return @"The requested product is not available in the store.";
    case SKErrorCloudServicePermissionDenied:
      return @"Access to cloud service information is not allowed.";
    case SKErrorCloudServiceNetworkConnectionFailed:
      return @"Could not connect to the network.";
    case SKErrorCloudServiceRevoked:
      return @"Cloud service revoked.";
    default:
      return error.localizedDescription;
  }
}
@end
