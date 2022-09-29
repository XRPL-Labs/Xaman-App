//
//  CipherTest.m
//  XUMMTests
//

#import <XCTest/XCTest.h>

#import "../XUMM/Libs/Security/Vault/Cipher/Cipher.h"

@interface CipherTest : XCTestCase

@end

@implementation CipherTest

- (void)testDerivedKeys {
  NSString *derivedKeysStringV1 = @"281dbfaeacea835d338ef73a840203a9";
  NSString *derivedKeysStringV2 = @"{\"version\":2,\"iv\":\"fc28f32f53a53005be309392dc751ce2149019191ce30e44fb5b655cf073a38e\",\"passcode_salt\":\"c1da8b63ffc2bdf7b269ec4dc858b624ffb06577cde774632ef4e413f405eb8b\",\"pre_key_salt\":\"8c7133f8fd75e8148797f8c86da1bf753b16c4c56b43f978ea985bfb50672139\",\"encr_key_salt\":\"412f3a1637b115c50df3a908cab566b2859a6382b2eba40903a399509d844753\"}";
  
  // should serialize derived key from v1 and v2
  // v1
  struct DerivedKeys derivedKeysV1 = [Cipher getDerivedKeys:derivedKeysStringV1];
  XCTAssertEqual(1, [derivedKeysV1.version intValue]);
  XCTAssertEqual(derivedKeysStringV1, derivedKeysV1.iv);
  // v2
  struct DerivedKeys derivedKeysV2 = [Cipher getDerivedKeys:derivedKeysStringV2];
  XCTAssertEqual(2, [derivedKeysV2.version intValue]);
  XCTAssertTrue([derivedKeysV2.iv isEqualToString:@"fc28f32f53a53005be309392dc751ce2149019191ce30e44fb5b655cf073a38e"]);
  XCTAssertTrue([derivedKeysV2.passcode_salt isEqualToString:@"c1da8b63ffc2bdf7b269ec4dc858b624ffb06577cde774632ef4e413f405eb8b"]);
  XCTAssertTrue([derivedKeysV2.pre_key_salt isEqualToString:@"8c7133f8fd75e8148797f8c86da1bf753b16c4c56b43f978ea985bfb50672139"]);
  XCTAssertTrue([derivedKeysV2.encr_key_salt isEqualToString:@"412f3a1637b115c50df3a908cab566b2859a6382b2eba40903a399509d844753"]);
}


- (void)testEncryptDecrypt {
  // should be able to encrypt with cipher v2
  NSString *clearText = @"Hello World";
  NSString *clearKey = @"Secret Key";
  NSString *clearKeyLong = @"jaefmsxpTq11C*V8PMoG1d80k3lje6EO$JW*QP8OK^X3ida&cFffSmp5WMB#olb2*aMhHWojYN90Ung5ZwnU36*awQ3Q&ztJ18jH";
  
  
  NSError *error;
  NSDictionary *cipherResult = [Cipher encrypt:clearText key:clearKey error:&error];
  
  // should return right values
  XCTAssertNil(error);
  XCTAssertNotNil(cipherResult);
  XCTAssertNotNil([cipherResult objectForKey:@"derived_keys"]);
  XCTAssertNotNil([cipherResult objectForKey:@"cipher"]);
  
  
  NSDictionary *derivedKeysDict = [cipherResult objectForKey:@"derived_keys"];
  NSString *cipher = [cipherResult objectForKey:@"cipher"];
  
  XCTAssertEqual(2, [[derivedKeysDict objectForKey:@"version"] intValue]);
  XCTAssertEqual(64, [[derivedKeysDict objectForKey:@"iv"] length]);
  XCTAssertEqual(64, [[derivedKeysDict objectForKey:@"passcode_salt"] length]);
  XCTAssertEqual(64, [[derivedKeysDict objectForKey:@"pre_key_salt"] length]);
  XCTAssertEqual(64, [[derivedKeysDict objectForKey:@"encr_key_salt"] length]);
  
  
  // try to decrypt the same values
  
  // first we turn dict derived key to string as this is the way we pass the data to decrypt method
  NSData *derivedKeyData = [NSJSONSerialization  dataWithJSONObject:[cipherResult objectForKey:@"derived_keys"] options:0 error:&error];
  XCTAssertNil(error);
  NSString *derivedKeyString = [[NSString alloc] initWithData:derivedKeyData encoding:NSUTF8StringEncoding];
  
  
  // try to decrypt the same values
  NSString *decryptResult = [Cipher decrypt:cipher key:clearKey derivedKeysString:derivedKeyString error:&error];
  
  XCTAssertNil(error);
  XCTAssertTrue([decryptResult isEqualToString:clearText]);
  
  
  // try to encrypt/decrypt with long key
  NSDictionary *cipherResultLongKey = [Cipher encrypt:clearText key:clearKeyLong error:&error];
  
  NSData *derivedKeyDataLongKey = [NSJSONSerialization  dataWithJSONObject:[cipherResultLongKey objectForKey:@"derived_keys"] options:0 error:&error];
  XCTAssertNil(error);
  NSString *derivedKeyStringLongKey = [[NSString alloc] initWithData:derivedKeyDataLongKey encoding:NSUTF8StringEncoding];
  NSString *decryptResultLongKey = [Cipher decrypt:[cipherResultLongKey objectForKey:@"cipher"] key:clearKeyLong derivedKeysString:derivedKeyStringLongKey error:&error];
  XCTAssertNil(error);
  XCTAssertTrue([decryptResultLongKey isEqualToString:clearText]);
}


- (void)testDecryptV1 {
  NSString *clearText = @"Hello World";
  NSString *clearKey = @"Secret Key";
  NSString *V1_IV = @"281dbfaeacea835d338ef73a840203a9";
  NSString *V1_Cipher = @"Shq6UW2DphA9x/PLxnlCjA==";
  
  NSError *error;
  NSString *decryptResult = [Cipher decrypt:V1_Cipher key:clearKey derivedKeysString:V1_IV error:&error];

  XCTAssertNil(error);
  XCTAssertTrue([decryptResult isEqualToString:clearText]);
  
}

@end
