package libs.security.vault;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Map;

import libs.security.providers.UniqueIdProvider;
import libs.security.vault.cipher.Cipher;
import libs.security.vault.storage.Keychain;

import extentions.PerformanceLogger;

@RunWith(AndroidJUnit4.class)
public class VaultMangerTest {
    static final String VAULT_NAME = "VAULT_TEST";
    static final String VAULT_DATA = "VAULT_TEST_DATA";
    static final String VAULT_KEY = "VAULT_TEST_KEY";
    static final String STORAGE_ENCRYPTION_KEY = "STORAGE_ENCRYPTION_KEY";

    private VaultManagerModule vaultManager = null;
    private Keychain keychain = null;

    private final static PerformanceLogger performanceLogger = new PerformanceLogger(
            "VaultMangerTestReport"
    );


    @BeforeClass
    public static void setUp() {
        UniqueIdProvider.sharedInstance().init(
                new ReactApplicationContext(
                        InstrumentationRegistry.getInstrumentation().getTargetContext()
                )
        );
    }

    @Before
    public void beforeEach() throws Exception {
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );

        vaultManager = new VaultManagerModule(context);
        keychain = new Keychain(context);

        // clear vault before every step
        vaultManager.purgeAll();
    }

    @After
    public void afterEach() {
        vaultManager = null;
    }

    @Test
    public void VaultTest() throws Exception {
        // should return false as vault is not exist
        performanceLogger.start("VAULT_EXIST_FALSE");
        Assert.assertFalse(vaultManager.vaultExist(VAULT_NAME));
        performanceLogger.end("VAULT_EXIST_FALSE");


        // should create the vault with the latest cipher and store in the keychain
        performanceLogger.start("CREATE_VAULT_NEW");
        Assert.assertTrue(vaultManager.createVault(
                VAULT_NAME,
                VAULT_DATA,
                VAULT_KEY
        ));
        performanceLogger.end("CREATE_VAULT_NEW");


        // should return true as vault is exist
        performanceLogger.start("VAULT_EXIST_TRUE");
        Assert.assertTrue(vaultManager.vaultExist(
                VAULT_NAME
        ));
        performanceLogger.end("VAULT_EXIST_TRUE");


        // try to create the same vault again, which should raise an error
        performanceLogger.start("CREATE_VAULT_EXIST");
        try {
            vaultManager.createVault(
                    VAULT_NAME,
                    VAULT_DATA,
                    VAULT_KEY
            );
        } catch (Exception ex) {
            Assert.assertEquals("VAULT_ALREADY_EXIST", ex.getMessage());
        }
        performanceLogger.end("CREATE_VAULT_EXIST");


        // verify we can fetch the vault and open with the provided key
        performanceLogger.start("OPEN_VAULT");
        Assert.assertEquals(VAULT_DATA, vaultManager.openVault(
                VAULT_NAME,
                VAULT_KEY
        ));
        performanceLogger.end("OPEN_VAULT");

        // should return false for migration required as vault has been created with latest cipher
        performanceLogger.start("IS_MIGRATION_REQUIRED");
        final WritableMap migrationRequiredResult = vaultManager.isMigrationRequired(
                VAULT_NAME
        );
        performanceLogger.end("IS_MIGRATION_REQUIRED");

        Assert.assertEquals(VAULT_NAME, migrationRequiredResult.getString("vault"));
        Assert.assertEquals(Cipher.getLatestCipherVersion(), migrationRequiredResult.getInt("current_cipher_version"));
        Assert.assertEquals(Cipher.getLatestCipherVersion(), migrationRequiredResult.getInt("latest_cipher_version"));
        Assert.assertFalse(migrationRequiredResult.getBoolean("migration_required"));


        // purge vault
        performanceLogger.start("PURGE_VAULT");
        Assert.assertTrue(vaultManager.purgeVault(VAULT_NAME));
        performanceLogger.end("PURGE_VAULT");

        // should return false as vault purged
        Assert.assertFalse(vaultManager.vaultExist(VAULT_NAME));
    }


    @Test
    public void StorageEncryptionKeyTest() throws Exception {
        // check if the key is not exist
        Assert.assertNull(keychain.getItem(STORAGE_ENCRYPTION_KEY));

        // should generate new encryption key and store in the keychain
        performanceLogger.start("GET_STORAGE_ENCRYPTION_KEY_GENERATE");
        Assert.assertNotNull(vaultManager.getStorageEncryptionKey(STORAGE_ENCRYPTION_KEY));
        performanceLogger.end("GET_STORAGE_ENCRYPTION_KEY_GENERATE");

        // get newly generated encryption from keychain
        Map<String, String> item = keychain.getItem(STORAGE_ENCRYPTION_KEY);
        String storageEncryptionKey = item.get("password");

        // should not be null
        Assert.assertNotNull(storageEncryptionKey);
        // check newly generated key length be 64 bytes
        Assert.assertEquals(128, storageEncryptionKey.length());

        // running the same method again should resolve to same encryption key
        performanceLogger.start("GET_STORAGE_ENCRYPTION_KEY_FETCH");
        Assert.assertEquals(storageEncryptionKey, vaultManager.getStorageEncryptionKey(
                STORAGE_ENCRYPTION_KEY
        ));
        performanceLogger.end("GET_STORAGE_ENCRYPTION_KEY_FETCH");
    }

    @AfterClass
    public static void afterAll() {
        performanceLogger.log();
    }

}
