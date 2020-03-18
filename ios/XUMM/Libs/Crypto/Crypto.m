#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonDigest.h>
#import <CommonCrypto/CommonKeyDerivation.h>

#import "Crypto.h"

@implementation CryptoModule

RCT_EXPORT_MODULE()

+ (NSString *) toHex:(NSData *)data {
      NSUInteger dataLength = data.length;
      if (dataLength == 0) {
          return nil;
      }

      const unsigned char *dataBuffer = data.bytes;
      NSMutableString *hexString  = [NSMutableString stringWithCapacity:(dataLength * 2)];
      for (int i = 0; i < dataLength; ++i) {
          [hexString appendFormat:@"%02x", dataBuffer[i]];
      }
      return [hexString copy];
}

+ (NSData *) fromHex: (NSString *)string {
    NSMutableData *data = [[NSMutableData alloc] init];
    unsigned char whole_byte;
    char byte_chars[3] = {'\0','\0','\0'};
    for (int i = 0; i < ([string length] / 2); i++) {
        byte_chars[0] = [string characterAtIndex:i*2];
        byte_chars[1] = [string characterAtIndex:i*2+1];
        whole_byte = strtol(byte_chars, NULL, 16);
        [data appendBytes:&whole_byte length:1];
    }
    return data;
}

+ (NSString *) pbkdf2:(NSString *)password salt: (NSString *)salt cost: (NSInteger)cost length: (NSInteger)length {
    // Data of String to generate Hash key(hexa decimal string).
    NSData *passwordData = [password dataUsingEncoding:NSUTF8StringEncoding];
    NSData *saltData = [salt dataUsingEncoding:NSUTF8StringEncoding];
    
    // Hash key (hexa decimal) string data length.
    NSMutableData *hashKeyData = [NSMutableData dataWithLength:length/8];
    
    // Key Derivation using PBKDF2 algorithm.
    int status = CCKeyDerivationPBKDF(
                                      kCCPBKDF2,
                                      passwordData.bytes,
                                      passwordData.length,
                                      saltData.bytes,
                                      saltData.length,
                                      kCCPRFHmacAlgSHA512,
                                      cost,
                                      hashKeyData.mutableBytes,
                                      hashKeyData.length);
    
    if (status == kCCParamError) {
        NSLog(@"Key derivation error");
        return @"";
    }
    
    return [self toHex:hashKeyData];
}

+ (NSData *) AES128CBC: (NSString *)operation data: (NSData *)data key: (NSString *)key iv: (NSString *)iv {
    //convert hex string to hex data
    NSData *keyData = [self fromHex:key];
    NSData *ivData = [self fromHex:iv];
    //    NSData *keyData = [key dataUsingEncoding:NSUTF8StringEncoding];
    size_t numBytes = 0;
    
    NSMutableData * buffer = [[NSMutableData alloc] initWithLength:[data length] + kCCBlockSizeAES128];
    
    CCCryptorStatus cryptStatus = CCCrypt(
                                          [operation isEqualToString:@"encrypt"] ? kCCEncrypt : kCCDecrypt,
                                          kCCAlgorithmAES128,
                                          kCCOptionPKCS7Padding,
                                          keyData.bytes, kCCKeySizeAES256,
                                          ivData.bytes,
                                          data.bytes, data.length,
                                          buffer.mutableBytes,  buffer.length,
                                          &numBytes);
    
    if (cryptStatus == kCCSuccess) {
        [buffer setLength:numBytes];
        return buffer;
    }
    NSLog(@"AES error, %d", cryptStatus);
    return nil;
}

+ (NSDictionary *) encrypt: (NSString *)clearText key: (NSString *)key {
    NSString *keyEnc = [self sha256:key];
    NSString *iv = [self randomKey:16];
    NSData *result = [self AES128CBC:@"encrypt" data:[clearText dataUsingEncoding:NSUTF8StringEncoding] key:keyEnc iv:iv];
    return @{
        @"cipher": [result base64EncodedStringWithOptions:0],
        @"iv": iv
    };
}

+ (NSString *) decrypt: (NSString *)cipherText key: (NSString *)key iv: (NSString *)iv {
    NSString *keyEnc = [self sha256:key];
    NSData *result = [self AES128CBC:@"decrypt" data:[[NSData alloc] initWithBase64EncodedString:cipherText options:0] key:keyEnc iv:iv];
    return [[NSString alloc] initWithData:result encoding:NSUTF8StringEncoding];
}

+ (NSString *) hmac256: (NSString *)input key: (NSString *)key {
    NSData *keyData = [self fromHex:key];
    NSData* inputData = [input dataUsingEncoding:NSUTF8StringEncoding];
    void* buffer = malloc(CC_SHA256_DIGEST_LENGTH);
    CCHmac(kCCHmacAlgSHA256, [keyData bytes], [keyData length], [inputData bytes], [inputData length], buffer);
    NSData *nsdata = [NSData dataWithBytesNoCopy:buffer length:CC_SHA256_DIGEST_LENGTH freeWhenDone:YES];
    return [self toHex:nsdata];
}

+ (NSString *) sha1: (NSString *)input {
    NSData* inputData = [input dataUsingEncoding:NSUTF8StringEncoding];
    NSMutableData *result = [[NSMutableData alloc] initWithLength:CC_SHA1_DIGEST_LENGTH];
    CC_SHA1([inputData bytes], (CC_LONG)[inputData length], result.mutableBytes);
    return [self toHex:result];
}

+ (NSString *) sha256: (NSString *)input {
    NSData* inputData = [input dataUsingEncoding:NSUTF8StringEncoding];
    unsigned char* buffer = malloc(CC_SHA256_DIGEST_LENGTH);
    CC_SHA256([inputData bytes], (CC_LONG)[inputData length], buffer);
    NSData *result = [NSData dataWithBytesNoCopy:buffer length:CC_SHA256_DIGEST_LENGTH freeWhenDone:YES];
    return [self toHex:result];
}

+ (NSString *) sha512: (NSString *)input {
    NSData* inputData = [input dataUsingEncoding:NSUTF8StringEncoding];
    unsigned char* buffer = malloc(CC_SHA512_DIGEST_LENGTH);
    CC_SHA512([inputData bytes], (CC_LONG)[inputData length], buffer);
    NSData *result = [NSData dataWithBytesNoCopy:buffer length:CC_SHA512_DIGEST_LENGTH freeWhenDone:YES];
    return [self toHex:result];
}

+ (NSString *)randomUUID {
    if(NSClassFromString(@"NSUUID")) { // only available in iOS >= 6.0
        return [[NSUUID UUID] UUIDString];
    }
    CFUUIDRef uuidRef = CFUUIDCreate(kCFAllocatorDefault);
    CFStringRef cfuuid = CFUUIDCreateString(kCFAllocatorDefault, uuidRef);
    CFRelease(uuidRef);
    NSString *uuid = [((__bridge NSString *) cfuuid) copy];
    CFRelease(cfuuid);
    return uuid;
}

+ (NSString *) randomKey: (NSInteger)length {
    NSMutableData *data = [NSMutableData dataWithLength:length];
    int result = SecRandomCopyBytes(kSecRandomDefault, length, data.mutableBytes);
    if (result != noErr) {
        return nil;
    }
    return [self toHex:data];
}

RCT_EXPORT_METHOD(encrypt:(NSString *)data key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSDictionary *result = [CryptoModule encrypt:data key:key];
    if (result == nil) {
        reject(@"encrypt_fail", @"Encrypt error", error);
    } else {
        resolve(result);
    }
}

RCT_EXPORT_METHOD(decrypt:(NSString *)base64 key:(NSString *)key iv:(NSString *)iv
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [CryptoModule decrypt:base64 key:key iv:iv];
    if (data == nil) {
        reject(@"decrypt_fail", @"Decrypt failed", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(pbkdf2:(NSString *)password salt:(NSString *)salt
                  cost:(NSInteger)cost length:(NSInteger)length
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [CryptoModule pbkdf2:password salt:salt cost:cost length:length];
    if (data == nil) {
        reject(@"keygen_fail", @"Key generation failed", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(hmac256:(NSString *)base64 key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [CryptoModule hmac256:base64 key:key];
    if (data == nil) {
        reject(@"hmac_fail", @"HMAC error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(sha1:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [CryptoModule sha1:text];
    if (data == nil) {
        reject(@"sha1_fail", @"Hash error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(sha256:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [CryptoModule sha256:text];
    if (data == nil) {
        reject(@"sha256_fail", @"Hash error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(sha512:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [CryptoModule sha512:text];
    if (data == nil) {
        reject(@"sha512_fail", @"Hash error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(randomUUID:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [CryptoModule randomUUID];
    if (data == nil) {
        reject(@"uuid_fail", @"Uuid error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(randomKey:(NSInteger)length
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    NSError *error = nil;
    NSString *data = [CryptoModule randomKey:length];
    if (data == nil) {
        reject(@"random_fail", @"Random key error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(randomKeySync:(NSInteger)length) {
    NSString *data = [CryptoModule randomKey:length];
    if (data == nil) {
        return nil;
    } else {
        return data;
    }
}


+ (BOOL)requiresMainQueueSetup {
    return YES;
}

@end

