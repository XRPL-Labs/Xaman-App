//
//  Crypto.swift
//  Created by XRPL-Labs on 05/09/2022.
//

import Foundation
import CryptoKit
import CommonCrypto


internal struct CryptError: LocalizedError {
  let message: String
  let status: Int32
  
  var errorDescription: String? {
    return "Crypto Error: \"\(message)\", status: \(status)"
  }
}

public extension Data {
  init?(hexString: String) {
    guard hexString.count.isMultiple(of: 2) else {
      return nil
    }
    
    let chars = hexString.map { $0 }
    let bytes = stride(from: 0, to: chars.count, by: 2)
      .map { String(chars[$0]) + String(chars[$0 + 1]) }
      .compactMap { UInt8($0, radix: 16) }
    
    guard hexString.count / bytes.count == 2 else { return nil }
    self.init(bytes)
  }
  
  var bytes: [UInt8] {
    [UInt8](self)
  }
  
  var hexadecimal: String {
    return self.map { String(format: "%02hhx", $0) }.joined()
  }
}

public extension SymmetricKey {
  /// A Data instance created safely from the contiguous bytes without making any copies.
  var dataRepresentation: Data {
    return withUnsafeBytes { bytes in
      let cfdata = CFDataCreateWithBytesNoCopy(nil, bytes.baseAddress?.assumingMemoryBound(to: UInt8.self), bytes.count, kCFAllocatorNull)
      return (cfdata as Data?) ?? Data()
    }
  }
}

@objc enum AESAlgo: Int {
  case CBC, GCM
}


@objc class Crypto: NSObject  {
  @objc static func DataToHex(data: Data) -> String {
    return data.hexadecimal
  }
  
  @objc static func HexToData(hexString: String) -> Data {
    return Data(hexString:hexString)!
  }
  
  @objc static func SHA1Hash(data: Data) -> Data {
    let digest = Insecure.SHA1.hash(data: data)
    return Data(digest);
  }
  
  @objc static func SHA256Hash(data: Data) -> Data {
    let digest = SHA256.hash(data: data)
    return Data(digest);
  }
  
  @objc static func SHA512Hash(data: Data) -> Data {
    let digest = SHA512.hash(data: data)
    return Data(digest);
  }
  
  @objc static func HMAC256(data: Data, key: Data) -> Data {
    let symmetricKey = SymmetricKey(data: key)
    let signature = HMAC<SHA256>.authenticationCode(for:data, using: symmetricKey)
    return Data(signature);
  }
  
  @objc static func PBKDF2(password: Data, salt: Data, iteration: Int) throws -> Data {
    // constants
    let HMAC_HASH_ALGO = kCCPRFHmacAlgSHA512;
    let KEY_LENGTH = kCCKeySizeAES256 // 256 bits = 32 bytes;

    var bytes = [UInt8](repeating: 0, count: kCCKeySizeAES256)
    try password.withUnsafeBytes { passwordBytes in
      try salt.withUnsafeBytes { saltBytes in
        let status = CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2),
                                          passwordBytes.baseAddress?.assumingMemoryBound(to: Int8.self),
                                          passwordBytes.count,
                                          saltBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                                          saltBytes.count,
                                          CCPseudoRandomAlgorithm(HMAC_HASH_ALGO),
                                          UInt32(iteration),
                                          &bytes,
                                          KEY_LENGTH)
        guard status == kCCSuccess else { throw CryptError(message: "PBKDF2 Failed", status: status) }
      }
    }
    
    return Data(bytes: UnsafePointer<UInt8>(bytes), count: kCCKeySizeAES256)
  }
  
  @objc static func RandomBytes(length: Int) throws -> Data {
    var bytes = [UInt8](repeating: 0, count: length)
    let status = SecRandomCopyBytes(kSecRandomDefault, length, &bytes)
    if status == errSecSuccess {
      return Data(bytes)
    }
    throw CryptError(message: "RandomBytes Failed", status: status)
  }
  
  
  @objc static func AESDecrypt(algo: AESAlgo, data: Data,using key: Data, iv: Data, aad: Data) throws -> Data {
    switch (algo){
    case AESAlgo.CBC:
      return try AESCBC.decrypt(data, using: SymmetricKey(data: key), iv: iv)
    case AESAlgo.GCM:
      return try AESGCM.decrypt(data, using: SymmetricKey(data: key), iv: iv, aad: aad)
    }
  }
  
  @objc static func AESEncrypt(algo: AESAlgo, data: Data,using key: Data, iv: Data, aad: Data) throws -> Data {
    switch (algo){
    case AESAlgo.CBC:
      throw CryptError(message: "AES-CBC deprecated and should not be used!", status: -1)
    case AESAlgo.GCM:
      return try AESGCM.encrypt(data, using: SymmetricKey(data: key), iv: iv, aad: aad)
    }
  }
  
  enum AESCBC {
    public static func encrypt(_ data: Data,using key: SymmetricKey, iv: Data) throws -> Data {
      try process(data, using: key, iv: iv, operation: .encrypt)
    }
    
    public static func decrypt(_ data: Data, using key: SymmetricKey, iv: Data) throws -> Data {
      try process(data, using: key, iv: iv, operation: .decrypt)
    }
    
    /// Process data, either encrypt or decrypt it
    private static func process(_ data: Data, using key: SymmetricKey, iv: Data, operation: Operation) throws -> Data {
      let inputBuffer = data.bytes
      let keyData = key.dataRepresentation.bytes
      let ivData = iv.bytes
      
      let bufferSize = inputBuffer.count + kCCBlockSizeAES128
      var outputBuffer = [UInt8](repeating: 0, count: bufferSize)
      var numBytesProcessed = 0
      
      let cryptStatus = CCCrypt(
        operation.operation, CCAlgorithm(kCCAlgorithmAES), CCOptions(kCCOptionPKCS7Padding),
        keyData, keyData.count, ivData, inputBuffer, inputBuffer.count,
        &outputBuffer, bufferSize, &numBytesProcessed
      )
      
      guard cryptStatus == CCCryptorStatus(kCCSuccess) else {
        throw CryptError(message: "AESCBC Failed", status: cryptStatus)
      }
      
      outputBuffer.removeSubrange(numBytesProcessed..<outputBuffer.count) //trim extra padding
      return Data(outputBuffer)
    }
    
    public enum Operation {
      case encrypt
      case decrypt
      
      internal var operation: CCOperation {
        CCOperation(self == .encrypt ? kCCEncrypt : kCCDecrypt)
      }
    }
  }
  
  
  enum AESGCM {
    public static func encrypt(_ data: Data,using key: SymmetricKey, iv: Data, aad: Data) throws -> Data {
      // double check for aad to be present
      guard aad != nil else { throw CryptError(message: "AAD data is required!", status: -1) }
      let sealedBox = try AES.GCM.seal(data, using:key, nonce: AES.GCM.Nonce(data: iv), authenticating: aad)
      return sealedBox.ciphertext + sealedBox.tag
    }
    
    public static func decrypt(_ data: Data, using key: SymmetricKey, iv: Data, aad: Data ) throws -> Data {
      // double check for aad to be present
      guard aad != nil else { throw CryptError(message: "AAD data is required!", status: -1) }
      let sealedBox = try AES.GCM.SealedBox(
        nonce: try AES.GCM.Nonce(data: iv),
        ciphertext: data.dropLast(16),
        tag: data.suffix(16)
      )
      let decrypted = try AES.GCM.open(sealedBox, using: key, authenticating: aad)
      return decrypted
    }
    
  }
  
  
}
