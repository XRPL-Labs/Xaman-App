//
//  V1+AesCbc.h
//  Xaman
//
// Created by XRPL-Labs on 01/09/2022.
//

#import <Foundation/Foundation.h>

#import "Cipher.h"

@interface CipherV1AesCbc : NSObject
+ (NSNumber *)getCipherVersion;
+ (NSDictionary *) encrypt: (NSString *)data  key: (NSString *)key;
+ (NSString *) decrypt: (NSString *)cipher key: (NSString *)key derivedKeys: (struct DerivedKeys)derivedKeys;
@end
