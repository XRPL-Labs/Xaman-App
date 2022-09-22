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
  
  NSData *passcodeHash = [Crypto PBKDF2WithPassword:[key dataUsingEncoding:NSUTF8StringEncoding] salt:passcodeSalt error:&error];
  
  CipherCheckCondition(error == nil,@"PBKDF2 passcodeHash error %@", [error localizedDescription]);
  
  NSData *uniqueDeviceId = [[UniqueIdProviderModule getDeviceUniqueId] dataUsingEncoding:NSUTF8StringEncoding];
  
  CipherCheckCondition(uniqueDeviceId != nil, @"uniqueDeviceId is nil");
  
  NSData *preKeySalt = [Crypto RandomBytesWithLength:32 error:&error];
  
  CipherCheckCondition(error == nil, @"RandomBytes preKeySalt error %@", [error localizedDescription]);
  
  // pre_key_salt + passcode_hash + device_uid
  NSMutableData *preKey = [NSMutableData data];
  [preKey appendData:preKeySalt];
  [preKey appendData:passcodeHash];
  [preKey appendData:uniqueDeviceId];
  
  // encr_key_salt = generate random string, 32 bytes
  NSData *encrKeySalt = [Crypto RandomBytesWithLength:32 error:&error];
  
  CipherCheckCondition(error == nil, @"RandomBytes encrKeySalt error %@", [error localizedDescription]);
  
  NSData *encrKey = [Crypto PBKDF2WithPassword:preKey salt:encrKeySalt error:&error];
  
  CipherCheckCondition(error == nil, @"PBKDF2 encrKey error %@", [error localizedDescription]);
  
  NSData *iv = [Crypto RandomBytesWithLength:32 error:&error];
  
  CipherCheckCondition(error == nil, @"RandomBytes iv error %@", [error localizedDescription]);
  
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
  NSData *passcodeHash = [Crypto PBKDF2WithPassword:[key dataUsingEncoding:NSUTF8StringEncoding] salt:[Crypto HexToDataWithHexString:derivedKeys.passcode_salt]  error:&error];
  
  
  CipherCheckCondition(error == nil, @"PBKDF2 passcodeHash error %@", [error localizedDescription]);
  
  NSData *uniqueDeviceId = [[UniqueIdProviderModule getDeviceUniqueId] dataUsingEncoding:NSUTF8StringEncoding];
  
  CipherCheckCondition(uniqueDeviceId != nil, @"UniqueIdProviderModule is nil");
  
  NSMutableData *preKey = [NSMutableData data];
  [preKey appendData:[Crypto HexToDataWithHexString:derivedKeys.pre_key_salt]];
  [preKey appendData:passcodeHash];
  [preKey appendData:uniqueDeviceId];
  
  NSData *encrKey = [Crypto PBKDF2WithPassword:preKey salt:[Crypto HexToDataWithHexString:derivedKeys.encr_key_salt] error:&error];
  
  CipherCheckCondition(error == nil, @"PBKDF2 encrKey error %@", [error localizedDescription]);
  
  NSData *decryptedData = [Crypto AESDecryptWithAlgo:AESAlgoGCM data:[Crypto HexToDataWithHexString:cipher] using:encrKey iv:[Crypto HexToDataWithHexString:derivedKeys.iv] aad:uniqueDeviceId error:&error];
  
  CipherCheckCondition(error == nil, @"AESAlgoGCM decrypt error %@", [error localizedDescription]);
  
  return [[NSString alloc] initWithData:decryptedData encoding:NSUTF8StringEncoding];
}

@end

