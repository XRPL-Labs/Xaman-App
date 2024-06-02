//
//  InAppPurchase+ProductRequestHandler.m
//  Xaman
//
//  Created by XRPL Labs on 02/06/2024.
//
#import "InAppPurchase+ProductRequestHandler.h"

#import <Foundation/Foundation.h>


@implementation ProductRequestHandler
- (void)startProductRequestForIdentifier:(NSString *)productId {
  SKProductsRequest *request = [[SKProductsRequest alloc] initWithProductIdentifiers:[NSSet setWithObject:productId]];
  request.delegate = self;
  [request start];
}

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response {
  [self callCompletionHandlerWithResult:TRUE productsList:response.products errorException:nil];
}

- (void)request:(SKRequest *)request didFailWithError:(NSError *)error {
  [self callCompletionHandlerWithResult:FALSE productsList:nil errorException:error];
}

- (void)callCompletionHandlerWithResult: (BOOL) didSucceed productsList:(NSArray <SKProduct*> *)products errorException:(NSError *)error {
  if (self.completionHandler) {
    self.completionHandler(didSucceed, products, error);
    self.completionHandler = nil;
  }else{
    @throw [NSException exceptionWithName:@"ProductRequestHandler" reason:@"no completion found?" userInfo:nil];
  }
}

@end
