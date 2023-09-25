#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonDigest.h>
#import <CommonCrypto/CommonKeyDerivation.h>

#import "Crypto.h"
#import "Xaman-Swift.h"


@implementation CryptoModule

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(hmac256:(NSString *)input key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSData *data = [Crypto HMAC256WithData:[input dataUsingEncoding:NSUTF8StringEncoding] key:[Crypto HexToDataWithHexString:key]];
  if (data == nil) {
    reject(@"HMAC256WithData", @"Hash error", nil);
  } else {
    resolve([Crypto DataToHexWithData:data]);
  }
}

RCT_EXPORT_METHOD(sha1:(NSString *)input
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSData *data = [Crypto SHA1HashWithData:[input dataUsingEncoding:NSUTF8StringEncoding]];
  if (data == nil) {
    reject(@"SHA1HashWithData", @"Hash error", nil);
  } else {
    resolve([Crypto DataToHexWithData:data]);
  }
}

RCT_EXPORT_METHOD(sha256:(NSString *)input
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSData *data = [Crypto SHA256HashWithData:[input dataUsingEncoding:NSUTF8StringEncoding]];
  if (data == nil) {
    reject(@"SHA256HashWithData", @"Hash error", nil);
  } else {
    resolve([Crypto DataToHexWithData:data]);
  }
}

RCT_EXPORT_METHOD(sha512:(NSString *)input
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSData *data = [Crypto SHA512HashWithData:[input dataUsingEncoding:NSUTF8StringEncoding]];
  if (data == nil) {
    reject(@"SHA512HashWithData", @"Hash error", nil);
  } else {
    resolve([Crypto DataToHexWithData:data]);
  }
}


RCT_EXPORT_METHOD(randomKey:(NSInteger)length
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSError *error;
  NSData *data = [Crypto RandomBytesWithLength:length error:&error];
  if (data == nil) {
    reject(@"RandomBytesWithLength", @"Random error", error);
  } else {
    resolve([Crypto DataToHexWithData:data]);
  }
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(randomKeySync:(NSInteger)length) {
  NSError *error;
  NSData *data = [Crypto RandomBytesWithLength:length error:&error];
  if (data == nil) {
    return nil;
  } else {
    return [Crypto DataToHexWithData:data];
  }
}


+ (BOOL)requiresMainQueueSetup {
  return YES;
}

@end

