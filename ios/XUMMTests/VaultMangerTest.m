//
//  VaultManagerTest.m
//  XUMMTests
//

#import <XCTest/XCTest.h>

#import "../XUMM/Libs/Security/Vault/VaultManager.h"
#import "../XUMM/Libs/Security/Vault/Cipher/Cipher.h"
#import "../XUMM/Libs/Security/Vault/Storage/Keychain.h"

@interface VaultManagerTest : XCTestCase

@end

@implementation VaultManagerTest

static NSString* VAULT_NAME = @"VAULT_TEST";
static NSString* VAULT_DATA = @"VAULT_TEST_DATA";
static NSString* VAULT_KEY = @"VAULT_TEST_KEY";
static NSString* STORAGE_ENCRYPTION_KEY = @"STORAGE_ENCRYPTION_KEY";

+ (void)setUp {
  // clear vault before starting the tests
  [VaultManagerModule purgeAll];
}

- (void)testVault {
  // should return false as vault is not exist
  XCTAssertFalse([VaultManagerModule vaultExist:VAULT_NAME]);
  // should create the vault with the latest cipher and store in the keychain
  XCTAssertTrue([VaultManagerModule createVault:VAULT_NAME data:VAULT_DATA key:VAULT_KEY]);
  // should return true as vault is exist
  XCTAssertTrue([VaultManagerModule vaultExist:VAULT_NAME]);
  // try to create the same vault again, which should raise an error
  XCTAssertThrows([VaultManagerModule createVault:VAULT_NAME data:VAULT_DATA key:VAULT_KEY]);
  // verify we can fetch the vault and open with the provided key
  XCTAssertTrue([VAULT_DATA isEqualToString:[VaultManagerModule openVault:VAULT_NAME key:VAULT_KEY]]);
  // should return false for migration required as vault has been created with latest cipher
  NSDictionary *migrationRequiredResult = [VaultManagerModule isMigrationRequired:VAULT_NAME];
  XCTAssertEqual(NO, [[migrationRequiredResult valueForKey:@"migration_required"] boolValue]);
  XCTAssertEqual([[Cipher getLatestCipherVersion] intValue], [[migrationRequiredResult valueForKey:@"latest_cipher_version"] intValue]);
  XCTAssertEqual([[Cipher getLatestCipherVersion] intValue], [[migrationRequiredResult valueForKey:@"current_cipher_version"] intValue]);
  // purge vault
  XCTAssertTrue([VaultManagerModule purgeVault:VAULT_NAME]);
  // should return false as vault purged
  XCTAssertFalse([VaultManagerModule vaultExist:VAULT_NAME]);
}


- (void)testStorageEncryptionKey {
  NSError *error;
  // check if the key is not exist
  XCTAssertNil([Keychain getItem:STORAGE_ENCRYPTION_KEY error:&error]);
  XCTAssertNil(error);
  // should generate new encryption key and store in the keychain
  XCTAssertNotNil([VaultManagerModule getStorageEncryptionKey:STORAGE_ENCRYPTION_KEY]);
  // get newly generated encryption from keychain
  NSDictionary *item = [Keychain getItem:STORAGE_ENCRYPTION_KEY error:&error];
  XCTAssertNil(error);
  NSString *storageEncryptionKey = item[@"data"];
  // check newly generated key length be 64 bytes
  XCTAssertEqual(128, [storageEncryptionKey length]);
  // running the same method again should resolve to same encryption key
  XCTAssertTrue([storageEncryptionKey isEqualToString:[VaultManagerModule getStorageEncryptionKey:STORAGE_ENCRYPTION_KEY]]);
}



@end
