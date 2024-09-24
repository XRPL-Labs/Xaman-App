//
//  VaultManagerTest.m
//  XUMMTests
//

#import <XCTest/XCTest.h>

#import "../XUMM/Libs/Security/Vault/VaultManager.h"
#import "../XUMM/Libs/Security/Vault/Cipher/Cipher.h"
#import "../XUMM/Libs/Security/Vault/Storage/Keychain.h"

#import "PerformanceLogger.h"

@interface VaultManagerTest : XCTestCase
@end

@implementation VaultManagerTest

static NSString* VAULT_NAME = @"VAULT_TEST";
static NSString* VAULT_NAME_RECOVERY = @"VAULT_TEST_RECOVER";
static NSString* VAULT_DATA = @"VAULT_TEST_DATA";
static NSString* VAULT_KEY = @"VAULT_TEST_KEY";
static NSString* VAULT_NEW_KEY = @"VAULT_TEST_NEW_KEY";
static PerformanceLogger *performanceLogger;


+ (void)setUp {
  // setup performance logger
  performanceLogger = [[PerformanceLogger alloc] initWithTag:@"VaultMangerTestReport"];

  // clear vault before starting the tests
  [VaultManagerModule clearStorage];
}

+ (void)tearDown {
  [performanceLogger log];
}

- (void)testVault {
  // should return false as vault is not exist
  [performanceLogger start:@"VAULT_EXIST_FALSE"];
  XCTAssertFalse([VaultManagerModule vaultExist:VAULT_NAME]);
  [performanceLogger end:@"VAULT_EXIST_FALSE"];
  // should create the vault with the latest cipher and store in the keychain
  [performanceLogger start:@"CREATE_VAULT_NEW"];
  XCTAssertTrue([VaultManagerModule createVault:VAULT_NAME data:VAULT_DATA key:VAULT_KEY]);
  [performanceLogger end:@"CREATE_VAULT_NEW"];
  // should return true as vault is exist
  [performanceLogger start:@"VAULT_EXIST_TRUE"];
  XCTAssertTrue([VaultManagerModule vaultExist:VAULT_NAME]);
  [performanceLogger end:@"VAULT_EXIST_TRUE"];
  // try to create the same vault again, which should raise an error
  [performanceLogger start:@"CREATE_VAULT_EXIST"];
  XCTAssertThrows([VaultManagerModule createVault:VAULT_NAME data:VAULT_DATA key:VAULT_KEY]);
  [performanceLogger end:@"CREATE_VAULT_EXIST"];
  // verify we can fetch the vault and open with the provided key
  [performanceLogger start:@"OPEN_VAULT"];
  XCTAssertTrue([VAULT_DATA isEqualToString:[VaultManagerModule openVault:VAULT_NAME key:VAULT_KEY recoverable:NO]]);
  [performanceLogger end:@"OPEN_VAULT"];
  // should return false for migration required as vault has been created with latest cipher
  [performanceLogger start:@"IS_MIGRATION_REQUIRED"];
  NSDictionary *migrationRequiredResult = [VaultManagerModule isMigrationRequired:VAULT_NAME];
  [performanceLogger end:@"IS_MIGRATION_REQUIRED"];
  XCTAssertEqual(NO, [[migrationRequiredResult valueForKey:@"migration_required"] boolValue]);
  XCTAssertEqual([[Cipher getLatestCipherVersion] intValue], [[migrationRequiredResult valueForKey:@"latest_cipher_version"] intValue]);
  XCTAssertEqual([[Cipher getLatestCipherVersion] intValue], [[migrationRequiredResult valueForKey:@"current_cipher_version"] intValue]);
  // purge vault
  [performanceLogger start:@"PURGE_VAULT"];
  XCTAssertTrue([VaultManagerModule purgeVault:VAULT_NAME]);
  [performanceLogger end:@"PURGE_VAULT"];
  // should return false as vault purged
  XCTAssertFalse([VaultManagerModule vaultExist:VAULT_NAME]);
}

- (void)testVaultRecovery{
  NSError *error;
  // check if vault && recovery vault is not exist
  XCTAssertNil([Keychain getItem:VAULT_NAME error:&error]);
  XCTAssertNil([Keychain getItem:VAULT_NAME_RECOVERY error:&error]);
  XCTAssertNil(error);
  // create recovery vault
  XCTAssertTrue([VaultManagerModule createVault:VAULT_NAME_RECOVERY data:VAULT_DATA key:VAULT_KEY]);
  // opening vault with recoverable flag should be able to restore vault
  [performanceLogger start:@"OPEN_VAULT_RECOVERED"];
  XCTAssertTrue([VaultManagerModule openVault:VAULT_NAME key:VAULT_KEY recoverable:YES]);
  [performanceLogger end:@"OPEN_VAULT_RECOVERED"];
  // check if the actual vault is there
  XCTAssertNotNil([Keychain getItem:VAULT_NAME error:&error]);
  XCTAssertNil([Keychain getItem:VAULT_NAME_RECOVERY error:&error]);
  // remove vault
  XCTAssertTrue([VaultManagerModule purgeVault:VAULT_NAME]);
}

- (void)testVaultReKey{
  NSError *error;
  // check if  vault is not exist
  XCTAssertNil([Keychain getItem:VAULT_NAME error:&error]);
  XCTAssertNil(error);
  // create the vault
  XCTAssertTrue([VaultManagerModule createVault:VAULT_NAME data:VAULT_DATA key:VAULT_KEY]);
  // should be able to reKey the vault with new key
  [performanceLogger start:@"VAULT_RE_KEY"];
  XCTAssertTrue([VaultManagerModule reKeyVault:VAULT_NAME oldKey:VAULT_KEY newKey:VAULT_NEW_KEY]);
  [performanceLogger end:@"VAULT_RE_KEY"];
  // should be able to open vault with new key
  XCTAssertTrue([VAULT_DATA isEqualToString:[VaultManagerModule openVault:VAULT_NAME key:VAULT_NEW_KEY recoverable:NO]]);
  // the recovery vault should not be exist
  XCTAssertNil([Keychain getItem:VAULT_NAME_RECOVERY error:&error]);
  XCTAssertNil(error);
  // remove vault
  XCTAssertTrue([VaultManagerModule purgeVault:VAULT_NAME]);
}

- (void)testVaultReKeyBatch{
  NSError *error;
  
  NSArray<NSString *> *vaults = @[
    [NSString stringWithFormat:@"%@%@", VAULT_NAME, @"1"],
    [NSString stringWithFormat:@"%@%@", VAULT_NAME, @"2"],
    [NSString stringWithFormat:@"%@%@", VAULT_NAME, @"3"]
  ];
  // check if vaults are not exist
  for (NSString * vaultName in vaults){
    XCTAssertNil([Keychain getItem:vaultName error:&error]);
    XCTAssertNil(error);
  }
  // create the vaults
  for (NSString * vaultName in vaults){
    XCTAssertTrue([VaultManagerModule createVault:vaultName data:VAULT_DATA key:VAULT_KEY]);
  }
  // should be able to reKey the batch of vaults
  [performanceLogger start:@"VAULT_BATCH_RE_KEY"];
  XCTAssertTrue([VaultManagerModule reKeyBatchVaults:vaults oldKey:VAULT_KEY newKey:VAULT_NEW_KEY]);
  [performanceLogger end:@"VAULT_BATCH_RE_KEY"];
  // should be able to open vaults with new key
  for (NSString * vaultName in vaults){
    XCTAssertTrue([VAULT_DATA isEqualToString:[VaultManagerModule openVault:vaultName key:VAULT_NEW_KEY recoverable:NO]]);
  }
  // the recovery vaults should not be exist
  for (NSString * vaultName in vaults){
    NSString * vaultRecoverName = [NSString stringWithFormat:@"%@%@", vaultName, @"_RECOVER"];
    XCTAssertNil([Keychain getItem:vaultRecoverName error:&error]);
    XCTAssertNil(error);
  }
}

- (void)testStorageEncryptionKey {
  NSError *error;
  // check if the key is not exist
  XCTAssertNil([Keychain getItem:STORAGE_ENCRYPTION_KEY error:&error]);
  XCTAssertNil(error);
  XCTAssertFalse([VaultManagerModule isStorageEncryptionKeyExist]);
  
  // should generate new encryption key and store in the keychain
  [performanceLogger start:@"GET_STORAGE_ENCRYPTION_KEY_GENERATE"];
  XCTAssertNotNil([VaultManagerModule getStorageEncryptionKey]);
  [performanceLogger end:@"GET_STORAGE_ENCRYPTION_KEY_GENERATE"];
  
  // should return true for storage encryption key exist
  XCTAssertTrue([VaultManagerModule isStorageEncryptionKeyExist]);
  
  // get newly generated encryption from keychain
  NSDictionary *item = [Keychain getItem:STORAGE_ENCRYPTION_KEY error:&error];
  XCTAssertNil(error);
  NSString *storageEncryptionKey = item[@"data"];
  // should not be null
  XCTAssertNotNil(storageEncryptionKey);
  // check newly generated key length be 64 bytes
  XCTAssertEqual(128, [storageEncryptionKey length]);
  // running the same method again should resolve to same encryption key
  [performanceLogger start:@"GET_STORAGE_ENCRYPTION_KEY_FETCH"];
  XCTAssertTrue([storageEncryptionKey isEqualToString:[VaultManagerModule getStorageEncryptionKey]]);
  [performanceLogger end:@"GET_STORAGE_ENCRYPTION_KEY_FETCH"];
}

@end
