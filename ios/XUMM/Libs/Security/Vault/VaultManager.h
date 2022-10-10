//
//  VaultManager.m
//  VaultManager
//
// Created by XRPL-Labs on 01/09/2022.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>

@interface VaultManagerModule : NSObject <RCTBridgeModule>
+ (BOOL)createVault:(NSString *)vaultName data:(NSString *)data key:(NSString *)key;
+ (BOOL)vaultExist:(NSString *)vaultName;
+ (BOOL)purgeVault:(NSString *)vaultName;
+ (BOOL)reKeyVault:(NSString *)vaultName oldKey:(NSString *)oldKey newKey:(NSString *)newKey;
+ (NSString *)openVault:(NSString *)vaultName key:(NSString *)key recoverable:(BOOL)recoverable;
+ (NSString *)getStorageEncryptionKey:(NSString *)keyName;
+ (NSDictionary *)isMigrationRequired:(NSString *)vaultName;
+ (void)purgeAll;
@end
