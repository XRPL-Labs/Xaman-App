#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#elif __has_include("React/RCTBridgeModule.h")
#import "React/RCTBridgeModule.h"
#else
#import "RCTBridgeModule.h"
#endif

#import <Foundation/Foundation.h>

@interface CryptoModule : NSObject <RCTBridgeModule>
+ (NSString *) encrypt: (NSString *)clearText  key: (NSString *)key;
+ (NSString *) decrypt: (NSString *)cipherText key: (NSString *)key iv: (NSString *)iv;
+ (NSString *) pbkdf2:(NSString *)password salt: (NSString *)salt cost: (NSInteger)cost length: (NSInteger)length;
+ (NSString *) hmac256: (NSString *)input key: (NSString *)key;
+ (NSString *) sha1: (NSString *)input;
+ (NSString *) sha256: (NSString *)input;
+ (NSString *) sha512: (NSString *)input;
+ (NSString *) toHex: (NSData *)nsdata;
+ (NSString *) randomUUID;
+ (NSString *) randomKey: (NSInteger)length;
@end
