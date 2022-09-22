package libs.security.vault.cipher;

import androidx.annotation.NonNull;

import org.json.JSONObject;
import org.json.JSONException;

import java.util.Map;

import libs.security.vault.exceptions.CryptoFailedException;

public class Cipher {
    public static class DerivedKeys {
        public int version;
        public String iv;
        public String passcode_salt;
        public String pre_key_salt;
        public String encr_key_salt;

        public String toJSONString() throws JSONException {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("version", this.version);
            jsonObject.put("iv", this.iv);
            jsonObject.put("passcode_salt", this.passcode_salt);
            jsonObject.put("pre_key_salt", this.pre_key_salt);
            jsonObject.put("encr_key_salt", this.encr_key_salt);
            return jsonObject.toString();
        }
    }

    /**
     * get Latest supported ciper version
     */
    public static int getLatestCipherVersion() {
        return CipherV2AesGcm.getCipherVersion();
    }


    @NonNull
    public static DerivedKeys getDerivedKeys(@NonNull final String derivedKeysString) {
        // detect which version used in derived keys
        // NOTE: in the first version the derived keys only contains (string) iv

        // try to deserialize derived keys
        DerivedKeys derivedKeys = new DerivedKeys();

        try {
            JSONObject derivedKeysObject = new JSONObject(derivedKeysString);

            // it's v2 encryption
            derivedKeys.version = derivedKeysObject.getInt("version");
            derivedKeys.iv = derivedKeysObject.getString("iv");
            derivedKeys.passcode_salt = derivedKeysObject.getString("passcode_salt");
            derivedKeys.pre_key_salt = derivedKeysObject.getString("pre_key_salt");
            derivedKeys.encr_key_salt = derivedKeysObject.getString("encr_key_salt");

            return derivedKeys;
        } catch (JSONException err) {
            // the derived key is string so it's the v1
            derivedKeys.version = 1;
            derivedKeys.iv = derivedKeysString;
            return derivedKeys;
        }
    }


    @NonNull
    public static Map<String, Object> encrypt(
            @NonNull final String input,
            @NonNull final String key
    ) throws CryptoFailedException {
        // use latest encryption method to encrypt data
        return CipherV2AesGcm.encrypt(input, key);
    }


    @NonNull
    public static String decrypt(
            @NonNull final String cipher,
            @NonNull final String key,
            @NonNull final String derivedKeysString
    ) throws CryptoFailedException {

        // try to deserialize derived keys
        DerivedKeys derivedKeys = getDerivedKeys(derivedKeysString);

        String clearText;

        // decrypt cipher base on provided derived keys version
        switch (derivedKeys.version) {
            case 1:
                clearText = CipherV1AesCbc.decrypt(cipher, key, derivedKeys);
                break;
            case 2:
                clearText = CipherV2AesGcm.decrypt(cipher, key, derivedKeys);
                break;
            default:
                throw new CryptoFailedException("No cipher for handling provider cipher version!", null);
        }

        // return decrypted clearText
        return clearText;
    }
}
