package libs.authentication.Biometric;

import android.app.KeyguardManager;
import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import java.security.InvalidAlgorithmParameterException;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;

import com.facebook.react.bridge.ReactApplicationContext;

import javax.crypto.Cipher;

public class SecurityProvider {
    private static final String KEY_KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "BiometricModuleKey";

    private static KeyStore keyStore;
    private static KeyPairGenerator keyPairGenerator;

    private static KeyStore getKeyStore() {
        if (keyStore != null) {
            return keyStore;
        }
        try {
            keyStore = KeyStore.getInstance(KEY_KEYSTORE);
            keyStore.load(null);
            return keyStore;
        } catch (Exception ignore) {
            return null;
        }
    }


    private static KeyPairGenerator getKeyPairGenerator() {
        if (keyPairGenerator != null) {
            return keyPairGenerator;
        }

        try {
            keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, KEY_KEYSTORE);
            return keyPairGenerator;
        } catch (Exception e) {
            return null;
        }
    }

    public static void generateKey() {
        KeyPairGenerator generator = getKeyPairGenerator();
        if (generator != null && !isKeyReady()) {
            try {
                generator.initialize(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                        .setDigests(KeyProperties.DIGEST_SHA256)
                        .setBlockModes(KeyProperties.BLOCK_MODE_ECB)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1)
                        // set this flag will invalidate the key in case of biometric change
                        .setUserAuthenticationRequired(true)
                        .setInvalidatedByBiometricEnrollment(true)
                        // .setIsStrongBoxBacked(true)
                        .build());

                generator.generateKeyPair();
            } catch (InvalidAlgorithmParameterException e) {
                // log
            } catch (Exception e) {
                if (e.getClass().getName().equals("android.security.KeyStoreException")) {
                    // Keystore is somehow broken?
                } else {
                    // ignore
                }
            }
        }
    }

    public static boolean isKeyguardSecure(ReactApplicationContext context) {
        KeyguardManager keyguardManager = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
        return keyguardManager.isKeyguardSecure();
    }

    public static void deleteInvalidKey() {
        KeyStore keyStore = getKeyStore();

        try {
            if (keyStore != null) {
                keyStore.deleteEntry(KEY_ALIAS);
            }
        } catch (KeyStoreException e) {
            // key not exist
        }
    }

    public static boolean isKeyReady() {
        try {
            return getKeyStore().containsAlias(KEY_ALIAS);
        } catch (KeyStoreException e) {
            // ignore
        }
        return false;
    }

    public static boolean checkDeviceBiometricChanged() {
        try {
            Cipher cipher = Cipher.getInstance(
                    KeyProperties.KEY_ALGORITHM_RSA + "/" +
                            KeyProperties.BLOCK_MODE_ECB + "/" +
                            KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1
            );
            cipher.init(Cipher.DECRYPT_MODE, keyStore.getKey(KEY_ALIAS, null));
            return false;
        } catch (Exception e) {
            return true;
        }
    }
}
