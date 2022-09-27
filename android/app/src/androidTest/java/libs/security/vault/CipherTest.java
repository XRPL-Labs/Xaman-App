package libs.security.vault;

import androidx.test.platform.app.InstrumentationRegistry;

import com.facebook.react.bridge.ReactApplicationContext;

import org.json.JSONException;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.Map;

import libs.security.providers.UniqueIdProvider;
import libs.security.vault.cipher.Cipher;
import libs.security.vault.exceptions.CryptoFailedException;

public class CipherTest {
    @BeforeClass
    public static void setUp() {
        UniqueIdProvider.sharedInstance().init(
                new ReactApplicationContext(
                        InstrumentationRegistry.getInstrumentation().getTargetContext()
                )
        );
    }

    @Test
    public void DerivedKeysTest() throws JSONException {
        final String derivedKeysStringV1 = "fc28f32f53a53005be309392dc751ce2149019191ce30e44fb5b655cf073a38e";
        final String derivedKeysStringV2 = "{\"version\":2,\"iv\":\"fc28f32f53a53005be309392dc751ce2149019191ce30e44fb5b655cf073a38e\",\"passcode_salt\":\"c1da8b63ffc2bdf7b269ec4dc858b624ffb06577cde774632ef4e413f405eb8b\",\"pre_key_salt\":\"8c7133f8fd75e8148797f8c86da1bf753b16c4c56b43f978ea985bfb50672139\",\"encr_key_salt\":\"412f3a1637b115c50df3a908cab566b2859a6382b2eba40903a399509d844753\"}";
        // should serialize derived key from v1 and v2
        // v1
        Cipher.DerivedKeys derivedKeysV1 = Cipher.getDerivedKeys(derivedKeysStringV1);
        Assert.assertEquals(1, derivedKeysV1.version);
        Assert.assertEquals("fc28f32f53a53005be309392dc751ce2149019191ce30e44fb5b655cf073a38e", derivedKeysV1.iv);
        // v2
        Cipher.DerivedKeys derivedKeysV2 = Cipher.getDerivedKeys(derivedKeysStringV2);
        Assert.assertEquals(2, derivedKeysV2.version);
        Assert.assertEquals("fc28f32f53a53005be309392dc751ce2149019191ce30e44fb5b655cf073a38e", derivedKeysV2.iv);
        Assert.assertEquals("c1da8b63ffc2bdf7b269ec4dc858b624ffb06577cde774632ef4e413f405eb8b", derivedKeysV2.passcode_salt);
        Assert.assertEquals("8c7133f8fd75e8148797f8c86da1bf753b16c4c56b43f978ea985bfb50672139", derivedKeysV2.pre_key_salt);
        Assert.assertEquals("412f3a1637b115c50df3a908cab566b2859a6382b2eba40903a399509d844753", derivedKeysV2.encr_key_salt);


        // should correctly turn the derived key object to string
        Assert.assertEquals(derivedKeysStringV2, derivedKeysV2.toJSONString());
    }


    @Test
    public void EncryptDecryptTest() throws CryptoFailedException, JSONException {
        // should be able to encrypt with cipher v2
        final String clearText = "Hello World";
        final String clearKey = "Secret Key";
        final String clearKeyLong = "jaefmsxpTq11C*V8PMoG1d80k3lje6EO$JW*QP8OK^X3ida&cFffSmp5WMB#olb2*aMhHWojYN90Ung5ZwnU36*awQ3Q&ztJ18jH";


        Map<String, Object> cipherResult = Cipher.encrypt(clearText, clearKey);

        // should return right values
        Assert.assertNotNull("cipherResult is null", cipherResult);
        Assert.assertNotNull("cipherResult cipher is null", cipherResult.get("cipher"));
        Assert.assertNotNull("cipherResult derived_keys is null", cipherResult.get("derived_keys"));

        Cipher.DerivedKeys derivedKeys = (Cipher.DerivedKeys) cipherResult.get("derived_keys");
        String cipher = (String) cipherResult.get("cipher");

        Assert.assertEquals(2, derivedKeys.version);
        Assert.assertEquals(64, derivedKeys.iv.length());
        Assert.assertEquals(64, derivedKeys.passcode_salt.length());
        Assert.assertEquals(64, derivedKeys.pre_key_salt.length());
        Assert.assertEquals(64, derivedKeys.encr_key_salt.length());


        // try to decrypt the same values
        String decryptResult = Cipher.decrypt(cipher, clearKey, derivedKeys.toJSONString());
        Assert.assertEquals(clearText, decryptResult);


        // try to encrypt/decrypt with long key
        Map<String, Object> cipherResultLong = Cipher.encrypt(clearText, clearKeyLong);
        String decryptResult2 = Cipher.decrypt((String) cipherResultLong.get("cipher"), clearKeyLong, ((Cipher.DerivedKeys) cipherResultLong.get("derived_keys")).toJSONString());
        Assert.assertEquals(clearText, decryptResult2);
    }

    @Test
    public void DecryptV1Test() throws CryptoFailedException {
        final String clearText = "Hello World";
        final String clearKey = "Secret Key";
        final String V1_IV = "281dbfaeacea835d338ef73a840203a9";
        final String V1_Cipher = "Shq6UW2DphA9x/PLxnlCjA==";

        String decryptResult = Cipher.decrypt(V1_Cipher, clearKey, V1_IV);
        Assert.assertEquals(clearText, decryptResult);
    }



}
