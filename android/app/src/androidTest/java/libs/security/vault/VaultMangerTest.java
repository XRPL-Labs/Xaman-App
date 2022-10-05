package libs.security.vault;

import androidx.test.platform.app.InstrumentationRegistry;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.Map;

import libs.security.providers.UniqueIdProvider;
import libs.security.vault.cipher.Cipher;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.storage.Keychain;

import extentions.PerformanceLogger;

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
    public void beforeEach() {
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );

        vaultManager = new VaultManagerModule(context);
        keychain = new Keychain(context);

        // clear vault before every step
        vaultManager.purgeAll(mock(Promise.class));
    }

    @After
    public void afterEach() {
        vaultManager = null;
    }

    @Test
    public void VaultTest() {
        // should return false as vault is not exist

        Promise promiseVaultNotExist = mock(Promise.class);
        performanceLogger.start("VAULT_EXIST_FALSE");
        vaultManager.vaultExist(
                VAULT_NAME,
                promiseVaultNotExist
        );
        performanceLogger.end("VAULT_EXIST_FALSE");
        verify(promiseVaultNotExist).resolve(false);


        // should create the vault with the latest cipher and store in the keychain
        Promise promiseCreate = mock(Promise.class);
        performanceLogger.start("CREATE_VAULT_NEW");
        vaultManager.createVault(
                VAULT_NAME,
                VAULT_DATA,
                VAULT_KEY,
                promiseCreate
        );
        performanceLogger.end("CREATE_VAULT_NEW");
        verify(promiseCreate).resolve(true);


        // should return true as vault is exist
        Promise promiseVaultExist = mock(Promise.class);
        performanceLogger.start("VAULT_EXIST_TRUE");
        vaultManager.vaultExist(
                VAULT_NAME,
                promiseVaultExist
        );
        performanceLogger.end("VAULT_EXIST_TRUE");
        verify(promiseVaultExist).resolve(true);


        // try to create the same vault again, which should raise an error
        Promise promiseCreateExist = mock(Promise.class);
        performanceLogger.start("CREATE_VAULT_EXIST");
        vaultManager.createVault(
                VAULT_NAME,
                VAULT_DATA,
                VAULT_KEY,
                promiseCreateExist
        );
        performanceLogger.end("CREATE_VAULT_EXIST");
        verify(promiseCreateExist).reject(
                "VAULT_ALREADY_EXIST",
                "Vault already exist, cannot overwrite current vault!"
        );


        // verify we can fetch the vault and open with the provided key
        Promise promiseOpen = mock(Promise.class);
        performanceLogger.start("OPEN_VAULT");
        vaultManager.openVault(
                VAULT_NAME,
                VAULT_KEY,
                promiseOpen
        );
        performanceLogger.end("OPEN_VAULT");
        verify(promiseOpen).resolve(VAULT_DATA);


        // should return false for migration required as vault has been created with latest cipher
        Promise promiseVaultIsMigrationRequired = mock(Promise.class);
        performanceLogger.start("IS_MIGRATION_REQUIRED");
        vaultManager.isMigrationRequired(
                VAULT_NAME,
                promiseVaultIsMigrationRequired
        );
        performanceLogger.end("IS_MIGRATION_REQUIRED");
        final WritableMap IsMigrationRequiredResults = Arguments.createMap();
        IsMigrationRequiredResults.putString("vault", VAULT_NAME);
        IsMigrationRequiredResults.putInt("current_cipher_version", Cipher.getLatestCipherVersion());
        IsMigrationRequiredResults.putInt("latest_cipher_version", Cipher.getLatestCipherVersion());
        IsMigrationRequiredResults.putBoolean("migration_required", false);
        verify(promiseVaultIsMigrationRequired).resolve(IsMigrationRequiredResults);


        // purge vault
        Promise promiseVaultPurge = mock(Promise.class);
        performanceLogger.start("PURGE_VAULT");
        vaultManager.purgeVault(
                VAULT_NAME,
                promiseVaultPurge
        );
        performanceLogger.end("PURGE_VAULT");
        verify(promiseVaultPurge).resolve(true);

        // should return false as vault purged
        Promise promiseVaultExistAfterPurge = mock(Promise.class);
        vaultManager.vaultExist(
                VAULT_NAME,
                promiseVaultExistAfterPurge
        );
        verify(promiseVaultExistAfterPurge).resolve(false);
    }


    @Test
    public void StorageEncryptionKeyTest() throws CryptoFailedException {
        // check if the key is not exist
        Assert.assertNull(keychain.getItem(STORAGE_ENCRYPTION_KEY));

        // should generate new encryption key and store in the keychain
        Promise promiseGetStorageEncryptionKeyFirst = mock(Promise.class);
        performanceLogger.start("GET_STORAGE_ENCRYPTION_KEY_GENERATE");
        vaultManager.getStorageEncryptionKey(
                STORAGE_ENCRYPTION_KEY,
                promiseGetStorageEncryptionKeyFirst
        );
        performanceLogger.end("GET_STORAGE_ENCRYPTION_KEY_GENERATE");

        // get newly generated encryption from keychain
        Map<String, String> item = keychain.getItem(STORAGE_ENCRYPTION_KEY);
        String storageEncryptionKey = item.get("password");

        // check newly generated key length be 64 bytes
        Assert.assertEquals(128, storageEncryptionKey.length());

        verify(promiseGetStorageEncryptionKeyFirst).resolve(storageEncryptionKey);

        // running the same method again should resolve to same encryption key
        Promise promiseGetStorageEncryptionKeySecond = mock(Promise.class);
        performanceLogger.start("GET_STORAGE_ENCRYPTION_KEY_FETCH");
        vaultManager.getStorageEncryptionKey(
                STORAGE_ENCRYPTION_KEY,
                promiseGetStorageEncryptionKeySecond
        );
        performanceLogger.end("GET_STORAGE_ENCRYPTION_KEY_FETCH");
        verify(promiseGetStorageEncryptionKeySecond).resolve(storageEncryptionKey);
    }

    @AfterClass
    public static void afterAll() {
        performanceLogger.log();
    }

}
