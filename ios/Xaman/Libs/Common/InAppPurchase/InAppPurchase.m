#import "InAppPurchase.h"

#import <React/RCTConvert.h>
#import <StoreKit/StoreKit.h>

#import "InAppPurchase+ProductRequestHandler.h"
#import "InAppPurchase+TransactionObserver.h"

@interface InAppPurchaseModule() {
  NSMutableSet<SKProduct *> *productDetailsMutableSet;
  ProductRequestHandler *productRequestHandler;
  TransactionObserver *transactionObserver;
}
@end

@implementation InAppPurchaseModule

static NSString *const E_CLIENT_IS_NOT_READY =  @"E_CLIENT_IS_NOT_READY";
static NSString *const E_PRODUCT_DETAILS_NOT_FOUND =   @"E_PRODUCT_DETAILS_NOT_FOUND";
static NSString *const E_PRODUCT_IS_NOT_AVAILABLE =   @"E_PRODUCT_IS_NOT_AVAILABLE";
static NSString *const E_NO_PENDING_PURCHASE =  @"E_NO_PENDING_PURCHASE";
static NSString *const E_PURCHASE_CANCELED = @"E_PURCHASE_CANCELED";
static NSString *const E_PURCHASE_FAILED =  @"E_PURCHASE_FAILED";
static NSString *const E_FINISH_TRANSACTION_FAILED = @"E_FINISH_TRANSACTION_FAILED";
static NSString *const E_ALREADY_PURCHASED  = @"E_ALREADY_PURCHASED";

RCT_EXPORT_MODULE();

+(BOOL)requiresMainQueueSetup {
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    productDetailsMutableSet = [[NSMutableSet alloc] init];
    productRequestHandler = [[ProductRequestHandler alloc] init];
    transactionObserver = [[TransactionObserver alloc] init];
  }
  return self;
}

-(void) dealloc {
  [[SKPaymentQueue defaultQueue] removeTransactionObserver:transactionObserver];
}

#pragma mark JS methods

/*
 restorePurchases
 purchase
 finalizePurchase
 isUserPurchasing
 */

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isUserPurchasing) {
  return @([InAppPurchaseModule isUserPurchasing]);
}

RCT_EXPORT_METHOD(getProductDetails:(NSString *)productID resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  
  
  // try to find the product details in our cached details
  [productDetailsMutableSet enumerateObjectsUsingBlock:^(SKProduct *product, BOOL *stop){
    if ([product.productIdentifier isEqualToString:productID]) {
      // already have cached version of product details
      resolve([self productToJson:product]);
      *stop = YES;
    }
  }];
  
  // we couldn't find product details, lets try to fetch it
  __weak typeof(self) weakSelf = self;
  // set the completion handler for product request
  self->productRequestHandler.completionHandler = ^(BOOL didSucceed, NSArray<SKProduct *> *products, NSError *error) {
    // we go the product details
    if (didSucceed) {
      __strong typeof(self) strongSelf = weakSelf;
      SKProduct *product;
      for(SKProduct *p in products) {
        // cache the product details
        [strongSelf->productDetailsMutableSet addObject:p];
        // find the product details we are looking for
        if([p.productIdentifier isEqualToString:productID]){
          product = p;
        }
      }
      if(product){
        resolve([strongSelf productToJson:product]);
      }else{
        reject(E_PRODUCT_IS_NOT_AVAILABLE, [NSString stringWithFormat:@"product with id %@ not found!", productID], nil);
      }
    }else{
      reject(E_PRODUCT_IS_NOT_AVAILABLE, [NSString stringWithFormat:@"product with id %@ not found!", productID], nil);
    }
  };
  
  // start the product details request
  [self->productRequestHandler startProductRequestForIdentifier:productID];
}

RCT_EXPORT_METHOD(purchase:(NSString *)productID resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  
  // check if user can make the payment
  if(![SKPaymentQueue canMakePayments]){
    reject(E_CLIENT_IS_NOT_READY, @"user cannot make payments due to parental controls", nil);
    return;
  }
  
  
  __block SKProduct * productForPurchase;
  
  // try to find the product details in our cached details
  [productDetailsMutableSet enumerateObjectsUsingBlock:^(SKProduct *product, BOOL *stop){
    if ([product.productIdentifier isEqualToString:productID]) {
      // already have cached version of product details
      productForPurchase = product;
      *stop = YES;
    }
  }];
  
  if(productForPurchase){
    // found the product details lets start the payment
    [self lunchBillingFlow:productForPurchase resolver:resolve rejecter:reject];
  }else{
    reject(E_PRODUCT_DETAILS_NOT_FOUND, [NSString stringWithFormat:@"product details with id %@ not found, make sure to run the getProductDetails method before purchase!", productID], nil);
  }
}

RCT_EXPORT_METHOD(finalizePurchase:(NSString *)transactionIdentifier resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if ([[SKPaymentQueue defaultQueue].transactions count] == 0) {
    reject(E_FINISH_TRANSACTION_FAILED, @"transactions queue is empty.", nil);
    return;;
  }
  
  BOOL isTransactionFinished = NO;
  for (SKPaymentTransaction *transaction in [[SKPaymentQueue defaultQueue] transactions]) {
    if ([transaction.transactionIdentifier isEqualToString:transactionIdentifier]){
      [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
      resolve(transactionIdentifier);
      isTransactionFinished = YES;
      break;
    }
  }
  
  if(!isTransactionFinished){
    reject(E_FINISH_TRANSACTION_FAILED, [NSString stringWithFormat:@"transaction with id %@ not found!", transactionIdentifier], nil);
  }
}

RCT_EXPORT_METHOD(restorePurchases:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  // set the completion handler for transaction updates
  self->transactionObserver.completionHandler = ^(NSArray<NSDictionary *> *result) {
    resolve(result);
  };
  
  // start the transaction observer and restore completed transactions
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self->transactionObserver];
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}


#pragma mark Private

-(void)lunchBillingFlow:(SKProduct *) product
               resolver:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject {
  // set the completion handler for transaction updates
  self->transactionObserver.completionHandler = ^(NSArray<NSDictionary *> *result) {
    resolve(result);
  };
  
  // start the transaction observer
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self->transactionObserver];
  
  SKPayment *payment = [SKPayment paymentWithProduct:product];
  [[SKPaymentQueue defaultQueue] addPayment:payment];
}



-(NSDictionary *)productToJson:(SKProduct *)product {
  NSNumberFormatter *numberFormatter = [[NSNumberFormatter alloc] init];
  [numberFormatter setFormatterBehavior:NSNumberFormatterBehavior10_4];
  [numberFormatter setNumberStyle:NSNumberFormatterCurrencyStyle];
  [numberFormatter setLocale:product.priceLocale];
  
  return @{
    @"title": [product localizedTitle],
    @"description": [product localizedDescription],
    @"price": [numberFormatter stringFromNumber:product.price],
    @"productId": [product productIdentifier],
  };
}


+(BOOL)isUserPurchasing {
  for (SKPaymentTransaction* transaction in [[SKPaymentQueue defaultQueue] transactions]) {
    if(transaction.transactionState == SKPaymentTransactionStatePurchasing) {
      return YES;
    }
  }
  return NO;
}

@end


#pragma mark API





