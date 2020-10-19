//
//  CryptoUnitTests.m
//  XUMMTests
//

#import <XCTest/XCTest.h>

#import "../XUMM/Libs/Crypto/Crypto.h"

@interface CryptoUnitTests : XCTestCase

@end

@implementation CryptoUnitTests

- (void)testRandomKey {
  NSString *data = [CryptoModule randomKey:16];
  
  XCTAssertNotNil(data);
  XCTAssertEqual([data length], 32);
}

- (void)testSHA1 {
  NSString *input = @"thisisatest";
  NSString *data = [CryptoModule sha1:input];
  XCTAssertNotNil(data);
  XCTAssertEqualObjects(data, @"42d4a62c53350993ea41069e9f2cfdefb0df097d");
}

- (void)testSHA256 {
  NSString *input = @"thisisatest";
  NSString *data = [CryptoModule sha256:input];
  XCTAssertNotNil(data);
  XCTAssertEqualObjects(data, @"a7c96262c21db9a06fd49e307d694fd95f624569f9b35bb3ffacd880440f9787");
}

- (void)testSHA512 {
  NSString *input = @"thisisatest";
  NSString *data = [CryptoModule sha512:input];
  XCTAssertNotNil(data);
  XCTAssertEqualObjects(data, @"d44edf261feb71975ee9275259b2eab75920d312cb1481a024306002dc57bf680e0c3b5a00edb6ffd15969369d8a714ccce1396937a57fd057ab312cb6c6d8b6");
}

- (void)testHMAC256 {
  NSString *input = @"thisisatest";
  NSString *key = @"b1ebcf12f5ff0a48b8f76604156a8d52e748";

  NSString *data = [CryptoModule hmac256:input key:key];

  XCTAssertNotNil(data);
  XCTAssertEqualObjects(data, @"2c5808c4833446895070b2946e6db446fc337a916730b63f46213684e38b4415");
}

- (void)testAES {
  NSString *input = @"somemessage";
  NSString *key = @"somekey";
  
  NSDictionary *encrypted = [CryptoModule encrypt:input key:key];
  
  XCTAssertNotNil(encrypted);
  XCTAssertNotNil(encrypted[@"cipher"]);
  XCTAssertNotNil(encrypted[@"iv"]);
  
  NSString *decrypted = [CryptoModule decrypt:encrypted[@"cipher"] key:key iv:encrypted[@"iv"]];
  
  XCTAssertEqualObjects(decrypted, input);
}


@end
