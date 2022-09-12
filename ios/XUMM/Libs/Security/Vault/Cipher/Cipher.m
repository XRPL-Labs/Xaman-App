//
//  Cipher.m
//  Created by XRPL-Labs on 01/09/2022.
//

#import "Cipher.h"

#import "V1+AesCbc.h"
#import "V2+AesGcm.h"

@implementation Cipher


+ (NSNumber *) getLatestCipherVersion {
  return [ CipherV2AesGcm getCipherVersion];
}

+ (struct DerivedKeys) getDerivedKeys: (NSString *)derivedKeysString {
  // detect which version used in dervided keys
  // NOTE: in the first version the derived keys only contains (string) iv
  
  // try to deserialize derived keys
  NSError * error;
  NSDictionary * dervivedKeysDict = (NSDictionary *)[NSJSONSerialization JSONObjectWithData:[derivedKeysString dataUsingEncoding:NSUTF8StringEncoding] options:NSJSONReadingMutableContainers error:&error];
  
  
  struct DerivedKeys derivedKeys;
  
  if(error) {
    // JSON text did not start with array or object and option to allow fragments not set
    // the derived key is string so it's the v1
    if(error.code == 3840){
      derivedKeys.version = @1;
      derivedKeys.iv = derivedKeysString;
      return derivedKeys;
    }
    // and unxpected error ocured during parsing the derived keys
    return derivedKeys;
  }
  
  // it's v2 encryption
  derivedKeys.version = [dervivedKeysDict objectForKey:@"version"];
  derivedKeys.iv =  [dervivedKeysDict objectForKey:@"iv"];
  derivedKeys.passcode_salt = [dervivedKeysDict objectForKey:@"passcode_salt"];
  derivedKeys.pre_key_salt = [dervivedKeysDict objectForKey:@"pre_key_salt"];
  derivedKeys.encr_key_salt = [dervivedKeysDict objectForKey:@"encr_key_salt"];
  
  return derivedKeys;
}

+ (NSDictionary *) encrypt: (NSString *)input key: (NSString *)key error:(NSError **)error {
  
  @try {
    // use latest encryption method to encrypt data
    NSDictionary *result = [CipherV2AesGcm encrypt:input key:key];
    
    // return derived keys and cipher
    return @{
      @"derived_keys": [result objectForKey:@"derived_keys"],
      @"cipher": [result objectForKey:@"cipher"]
    };
  } @catch (NSException* exception) {
    // pass any exception to the error
    *error = [NSError errorWithDomain:exception.name code:0 userInfo:@{
      NSUnderlyingErrorKey: exception,
      NSDebugDescriptionErrorKey: exception.userInfo ?: @{ },
      NSLocalizedFailureReasonErrorKey: (exception.reason ?: @"???") }];
  };
  
  return nil;
}

+ (NSString *) decrypt: (NSString *)cipher key: (NSString *)key derivedKeysString: (NSString *)derivedKeysString error:(NSError **)error {
  @try {
    // try to deserialize derived keys
    struct DerivedKeys derivedKeys = [self getDerivedKeys:derivedKeysString];
    
    // unable to iniate the derived keys
    CipherCheckCondition(derivedKeys.version != nil, @"Unable to parse derived keys!");
    
    NSString *clearText = nil;
    
    switch([derivedKeys.version intValue]){
      case 1  :
        clearText = [CipherV1AesCbc decrypt:cipher key:key derivedKeys:derivedKeys];
        break;
      case 2  :
        clearText = [CipherV2AesGcm decrypt:cipher key:key derivedKeys:derivedKeys];
        break;
      default:
        // NOTE: this should never happen
        *error = [NSError errorWithDomain:@"UNSUPPORTED_VERSION" code:-1 userInfo:@{
          NSLocalizedDescriptionKey:@"No cipher for handling the provider cipher version!"
        }];
        return nil;
    }
    
    // return decrypted clearText
    return clearText;
    
  } @catch (NSException* exception) {
    // pass any exception to the error
    *error = [NSError errorWithDomain:exception.name code:0 userInfo:@{
      NSUnderlyingErrorKey: exception,
      NSDebugDescriptionErrorKey: exception.userInfo ?: @{ },
      NSLocalizedFailureReasonErrorKey: (exception.reason ?: @"???") }];
  };
  
  return nil;
}


@end
