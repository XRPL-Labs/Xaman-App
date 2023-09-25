#import "V1+AesCbc.h"
#import "Xaman-Swift.h"

#define CIPHER_VERSION @1

@implementation CipherV1AesCbc

+(NSNumber *) getCipherVersion {
  return CIPHER_VERSION;
}

// NOTE: THIS METHOD SHOULD NOT BE USED AS WE MOVED TO NEW ENCRYPTION ALGO
+ (NSDictionary *) encrypt: (NSString *)input key: (NSString *)key {
  @throw [NSException exceptionWithName:@"Deprecated Method"
                                 reason:@"This method is deprecated and SHOULD NOT be used!"
                               userInfo:nil];
}

+ (NSString *) decrypt: (NSString *)cipher key: (NSString *)key derivedKeys:(struct DerivedKeys)derivedKeys{
  NSError *error;
  // sha256 encryption key
  NSData *hashedKeyData = [Crypto SHA256HashWithData:[key dataUsingEncoding:NSUTF8StringEncoding]];
  // cipher data is base64 encoded while encrypting in v1 encryption
  NSData *ciperData = [[NSData alloc] initWithBase64EncodedString:cipher options:0];
  
  CipherCheckCondition(ciperData != nil, @"Base64Encode ciperData is nil");
  
  //convert hex iv string to hex data
  NSData *ivData = [Crypto HexToDataWithHexString:derivedKeys.iv];
  
  NSData *decryptedData = [Crypto AESDecryptWithAlgo:AESAlgoCBC data:ciperData using:hashedKeyData iv:ivData aad:nil error:&error];
  
  CipherCheckCondition(error == nil, @"AESAlgoCBC decrypt error %@", [error localizedDescription]);
  
  return [[NSString alloc] initWithData:decryptedData encoding:NSUTF8StringEncoding];
}

@end

