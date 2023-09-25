#import "InAppPurchase.h"

#import <React/RCTConvert.h>
#import <StoreKit/StoreKit.h>

@interface InAppPurchaseModule() <SKRequestDelegate> {
  NSArray *products;
  NSMutableDictionary *promises;
}
@end

@implementation InAppPurchaseModule


#define kXamanProProductIdentifier @"com.xrpllabs.xaman.pro.test"

#define E_UNABLE_TO_MAKE_PAYMENTS @"E_UNABLE_TO_MAKE_PAYMENTS"
#define E_PRODUCT_IS_NOT_AVAILABLE @"E_PRODUCT_IS_NOT_AVAILABLE"
#define E_PURCHAES_CANCELED @"E_PURCHAES_CANCELED"
#define E_PURCHAES_FALIED @"E_PURCHAES_FALIED"
#define E_NO_PURCHASE_HISTORY @"E_NO_PURCHASE_HISTORY"

#define SUCCES_PURCHASE @"SUCCES_PURCHASE"

RCT_EXPORT_MODULE();

+(BOOL)requiresMainQueueSetup {
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    promises = [NSMutableDictionary dictionary];
    products = [[NSMutableArray alloc] init];
    
    [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
  }
  return self;
}

-(void) dealloc {
  [[SKPaymentQueue defaultQueue] removeTransactionObserver:self];
}

RCT_EXPORT_METHOD(init:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  // already initialized
  if([products count] > 0){
    return resolve(@YES);
  }
  
  SKProductsRequest *productsRequest = [[SKProductsRequest alloc] initWithProductIdentifiers:[NSSet setWithObject:kXamanProProductIdentifier]];
  
  [self addCallback:RCTKeyForInstance(productsRequest) resolver:resolve rejecter:reject];
  
  productsRequest.delegate = self;
  [productsRequest start];
}

RCT_EXPORT_METHOD(receiptData:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString* receipt = [self getReceiptData];
    if (!receipt) {
      reject(@"not_available", @"not_available", nil);
    } else {
      resolve(receipt);
    }
}

RCT_EXPORT_METHOD(purchase:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  
  if(![SKPaymentQueue canMakePayments]){
    return reject(E_UNABLE_TO_MAKE_PAYMENTS, @"User cannot make payments due to parental controls", nil);
  }
  
  if([products count] == 0){
    return reject(E_PRODUCT_IS_NOT_AVAILABLE, @"No product is available, forget to load the product?", nil);
  }
  
  SKProduct *product;
  for(SKProduct *p in products)
  {
    if([kXamanProProductIdentifier isEqualToString:p.productIdentifier]) {
      product = p;
      break;
    }
  }
  
  if(product) {
    SKPayment *payment = [SKPayment paymentWithProduct:product];
    [self addCallback:product.productIdentifier resolver:resolve rejecter:reject];
    [[SKPaymentQueue defaultQueue] addPayment:payment];
  }else{
    return reject(E_PRODUCT_IS_NOT_AVAILABLE, @"Xaman Pro product is not available", nil);
  }
}

RCT_EXPORT_METHOD(restorePurchase:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [self addCallback:RCTKeyForInstance(@"PAYMENT_RESTORE_PROMISE") resolver:resolve rejecter:reject];
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
  
}

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response{
  // set products in the list
  products = [NSMutableArray arrayWithArray:response.products];
  [self resolveForKey:RCTKeyForInstance(request) value:@YES];
}

- (void)paymentQueue:(SKPaymentQueue *)queue restoreCompletedTransactionsFailedWithError:(NSError *)error
{
  [self rejectForKey:RCTKeyForInstance(@"PAYMENT_RESTORE_PROMISE") value:E_NO_PURCHASE_HISTORY];
}

- (void)paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue
{
  for(SKPaymentTransaction *transaction in queue.transactions){
    if(transaction.transactionState == SKPaymentTransactionStateRestored && [kXamanProProductIdentifier isEqualToString:transaction.payment.productIdentifier] ) {
      NSString* receipt = [self getReceiptData];
      [self resolveForKey:RCTKeyForInstance(@"PAYMENT_RESTORE_PROMISE") value:receipt];
      [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    }
  }
  
  [self rejectForKey:RCTKeyForInstance(@"PAYMENT_RESTORE_PROMISE") value:E_NO_PURCHASE_HISTORY];
}

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions{
  for(SKPaymentTransaction *transaction in transactions){
    switch(transaction.transactionState){
      case SKPaymentTransactionStatePurchased:{
        NSString* receipt = [self getReceiptData];
        [self resolveForKey:transaction.payment.productIdentifier value:receipt];
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        break;
      }
      case SKPaymentTransactionStateRestored:
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        break;
      case SKPaymentTransactionStateFailed:
        //called when the transaction does not finish
        if(transaction.error.code == SKErrorPaymentCancelled){
          [self rejectForKey:transaction.payment.productIdentifier value:E_PURCHAES_CANCELED];
        }else{
          [self rejectForKey:transaction.payment.productIdentifier value:E_PURCHAES_FALIED];
        }
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        break;
    }
  }
}

+(BOOL)isUserPurchasing {
  for (SKPaymentTransaction* transaction in [[SKPaymentQueue defaultQueue] transactions]) {
    if(transaction.transactionState == SKPaymentTransactionStatePurchasing) {
      return YES;
    }
  }
  return NO;
}

- (NSString *)getReceiptData {
  NSURL *receiptUrl = [[NSBundle mainBundle] appStoreReceiptURL];
  NSData *receiptData = [NSData dataWithContentsOfURL:receiptUrl];
  if (!receiptData) {
    return(nil);
  } else {
    return([receiptData base64EncodedStringWithOptions:0]);
  }
}

- (void)addCallback:(NSString *)key resolver:(RCTPromiseResolveBlock)resolve
           rejecter:(RCTPromiseRejectBlock)reject {
  NSDictionary *callback = @{
    @"reject": reject,
    @"resolve": resolve,
  };
  [promises setValue:callback forKey:key];
  
}

- (void)rejectForKey:(NSString *)key value:(NSString *)value {
  if([promises valueForKey:key]){
    RCTPromiseRejectBlock reject = [[promises valueForKey:key] valueForKey:@"reject"];
    // remove promise
    [promises removeObjectForKey:key];
    // call resolve callback
    reject(value, value, nil);
  }
}

- (void)resolveForKey:(NSString *)key value:(NSString *)value {
  if([promises valueForKey:key]){
    RCTPromiseResolveBlock resolve = [[promises valueForKey:key] valueForKey:@"resolve"];
    // remove promise
    [promises removeObjectForKey:key];
    // call resolve callback
    resolve(value);
  }
}

#pragma mark Private

static NSString *RCTKeyForInstance(id instance)
{
  return [NSString stringWithFormat:@"%p", instance];
}

@end
