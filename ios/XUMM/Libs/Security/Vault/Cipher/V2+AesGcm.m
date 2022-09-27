#import "V2+AesGcm.h"

#import "UniqueIdProvider.h"
#import "XUMM-Swift.h"

#define CIPHER_VERSION @2

@implementation CipherV2AesGcm

// define version
+(NSNumber *) getCipherVersion {
  return CIPHER_VERSION;
}

+ (NSDictionary *) encrypt: (NSString *)input key: (NSString *)key {
  NSError *error;
  NSData *passcodeSalt = [Crypto RandomBytesWithLength:32 error:&error];
  
  CipherCheckCondition(error == nil, @"RandomBytes passcodeSalt error %@", [error localizedDescription]);
  
  // NOTE: using "91337" as iteration count is a conscious choice to save performance.
  NSData *passcodeHash = [Crypto PBKDF2WithPassword:[key dataUsingEncoding:NSUTF8StringEncoding] salt:passcodeSalt iteration:91337 error:&error];
  
  CipherCheckCondition(error == nil,@"PBKDF2 passcodeHash error %@", [error localizedDescription]);
  
  // get device unique id for using in preKey and AAD
  NSData *uniqueDeviceId = [[UniqueIdProviderModule getDeviceUniqueId] dataUsingEncoding:NSUTF8StringEncoding];
  
  CipherCheckCondition(uniqueDeviceId != nil, @"uniqueDeviceId is nil");
  
  // random preKeySalt 32 bytes
  NSData *preKeySalt = [Crypto RandomBytesWithLength:32 error:&error];
  
  CipherCheckCondition(error == nil, @"RandomBytes preKeySalt error %@", [error localizedDescription]);
  
  // preKey = preKeySalt + passcodeHash + uniqueDeviceId
  NSMutableData *preKey = [NSMutableData data];
  [preKey appendData:preKeySalt];
  [preKey appendData:passcodeHash];
  [preKey appendData:uniqueDeviceId];
  
  // random encrKeySalt 32 bytes
  NSData *encrKeySalt = [Crypto RandomBytesWithLength:32 error:&error];
  
  CipherCheckCondition(error == nil, @"RandomBytes encrKeySalt error %@", [error localizedDescription]);
  
  // NOTE: using "33" as iteration count is a conscious choice to save performance.
  NSData *encrKey = [Crypto PBKDF2WithPassword:preKey salt:encrKeySalt iteration:33 error:&error];
  
  CipherCheckCondition(error == nil, @"PBKDF2 encrKey error %@", [error localizedDescription]);
  
  // random iv 32 bytes
  NSData *iv = [Crypto RandomBytesWithLength:32 error:&error];
  
  CipherCheckCondition(error == nil, @"RandomBytes iv error %@", [error localizedDescription]);
  
  // encrypt using AES GCM
  NSData *encryptedData = [Crypto AESEncryptWithAlgo:AESAlgoGCM data:[input dataUsingEncoding:NSUTF8StringEncoding] using:encrKey iv:iv aad:uniqueDeviceId error:&error];
  
  CipherCheckCondition(error == nil, @"AESAlgoGCM encrypt error %@", [error localizedDescription]);
  
  return @{
    @"derived_keys": @{
      @"version": CIPHER_VERSION,
      @"iv": [Crypto DataToHexWithData:iv],
      @"passcode_salt":  [Crypto DataToHexWithData:passcodeSalt],
      @"pre_key_salt": [Crypto DataToHexWithData:preKeySalt],
      @"encr_key_salt": [Crypto DataToHexWithData:encrKeySalt],
    },
    @"cipher":  [Crypto DataToHexWithData:encryptedData],
  };
  
}

+ (NSString *) decrypt: (NSString *)cipher key: (NSString *)key derivedKeys:(struct DerivedKeys)derivedKeys {
  NSError *error;
  
  // NOTE: using "91337" as iteration count is a conscious choice to save performance.
  NSData *passcodeHash = [Crypto PBKDF2WithPassword:[key dataUsingEncoding:NSUTF8StringEncoding] salt:[Crypto HexToDataWithHexString:derivedKeys.passcode_salt]  iteration:91337 error:&error];
  
  
  CipherCheckCondition(error == nil, @"PBKDF2 passcodeHash error %@", [error localizedDescription]);
  
  // get device unique id for using in preKey and AAD
  NSData *uniqueDeviceId = [[UniqueIdProviderModule getDeviceUniqueId] dataUsingEncoding:NSUTF8StringEncoding];
  
  CipherCheckCondition(uniqueDeviceId != nil, @"UniqueIdProviderModule is nil");
  
  // preKey = preKeySalt + passcodeHash + uniqueDeviceId
  NSMutableData *preKey = [NSMutableData data];
  [preKey appendData:[Crypto HexToDataWithHexString:derivedKeys.pre_key_salt]];
  [preKey appendData:passcodeHash];
  [preKey appendData:uniqueDeviceId];
  
  
  // NOTE: using "33" as iteration count is a conscious choice to save performance.
  NSData *encrKey = [Crypto PBKDF2WithPassword:preKey
                                          salt:[Crypto HexToDataWithHexString:derivedKeys.encr_key_salt]
                                     iteration:33
                                         error:&error];
  
  CipherCheckCondition(error == nil, @"PBKDF2 encrKey error %@", [error localizedDescription]);
  
  // decrypt using AES GCM
  NSData *decryptedData = [Crypto AESDecryptWithAlgo:AESAlgoGCM
                                                data:[Crypto HexToDataWithHexString:cipher]
                                               using:encrKey
                                                  iv:[Crypto HexToDataWithHexString:derivedKeys.iv]
                                                 aad:uniqueDeviceId error:&error];
  
  CipherCheckCondition(error == nil, @"AESAlgoGCM decrypt error %@", [error localizedDescription]);
  
  return [[NSString alloc] initWithData:decryptedData encoding:NSUTF8StringEncoding];
}

@end

