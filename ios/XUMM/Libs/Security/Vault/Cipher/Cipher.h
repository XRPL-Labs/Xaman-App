//
//  Cipher.h
//  Created by XRPL-Labs on 01/09/2022.
//

#import <Foundation/Foundation.h>

#define CipherCheckCondition(condition, desc, ...) \
   do { \
       const BOOL conditionResult = !!(condition); \
       if (!conditionResult) { \
         [NSException raise:@"Cipher error" format:(desc), ##__VA_ARGS__]; \
       } \
   } while(0)


struct DerivedKeys {
  NSNumber *version;
  NSString *iv;
  NSString *passcode_salt;
  NSString *pre_key_salt;
  NSString *encr_key_salt;
};

@interface Cipher : NSObject
+ (struct DerivedKeys) getDerivedKeys: (NSString *)derivedKeysString;
+ (NSNumber *) getLatestCipherVersion;
+ (NSDictionary *) encrypt: (NSString *)data  key: (NSString *)key error:(NSError **)error;
+ (NSString *) decrypt: (NSString *)ciper key: (NSString *)key derivedKeysString:(NSString *)derivedKeysString error:(NSError **)error ;
@end
