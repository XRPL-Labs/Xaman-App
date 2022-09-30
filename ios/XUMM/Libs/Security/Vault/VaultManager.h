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
+ (NSDictionary *)isMigrationRequired:(NSString *)vaultName;
+ (NSString *)openVault:(NSString *)vaultName key:(NSString *)key;
+ (NSString *)getStorageEncryptionKey:(NSString *)keyName;
+ (void)purgeAll;
@end
