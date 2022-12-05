//
//  VaultManager.m
//  VaultManager
//
// Created by XRPL-Labs on 01/09/2022.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>

@interface VaultManagerModule : NSObject <RCTBridgeModule>

extern NSString * const STORAGE_ENCRYPTION_KEY;
extern NSString * const RECOVERY_SUFFIX;

+ (BOOL)createVault:(NSString *)vaultName data:(NSString *)data key:(NSString *)key;
+ (BOOL)vaultExist:(NSString *)vaultName;
+ (BOOL)purgeVault:(NSString *)vaultName;
+ (BOOL)reKeyVault:(NSString *)vaultName oldKey:(NSString *)oldKey newKey:(NSString *)newKey;
+ (BOOL)reKeyBatchVaults:(NSArray *)vaultNames oldKey:(NSString *)oldKey newKey:(NSString *)newKey;
+ (NSString *)openVault:(NSString *)vaultName key:(NSString *)key recoverable:(BOOL)recoverable;
+ (NSDictionary *)isMigrationRequired:(NSString *)vaultName;
+ (NSString *)getStorageEncryptionKey;
+ (BOOL)isStorageEncryptionKeyExist;
+ (void)purgeAll;
@end
