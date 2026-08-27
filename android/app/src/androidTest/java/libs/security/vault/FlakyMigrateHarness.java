package libs.security.vault;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.xrpllabs.xumm.BuildConfig;

import com.facebook.react.bridge.ReactApplicationContext;

import org.json.JSONObject;
import org.junit.Assume;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import android.util.Log;

import libs.security.providers.UniqueIdProvider;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.storage.Keychain;

/**
 * Manual androidTest only. Never ships in the Play APK.
 *
 * RISK: export writes plaintext account secret and account password to
 * flaky-export.json. The instrument argument account_password_b64 lands in
 * shell history. Do not run on a production wallet. Delete the export file
 * after the last step.
 *
 * Manual: am instrument -e flaky_step export|import_flaky|import_fix|probe|restore_last_known
 * -e account_password_b64 ...
 */
@RunWith(AndroidJUnit4.class)
public class FlakyMigrateHarness {
    private static final String TAG = "FlakyMigrate";
    private static final String REALM_KEY_ALIAS = VaultManagerModule.STORAGE_ENCRYPTION_KEY;
    private static final String UNIQUE_ID_ALIAS = "device-unique-id";
    private static final String LAST_KNOWN_PREFS = "xaman_device_id";

    private ReactApplicationContext reactContext;
    private VaultManagerModule vaultManager;
    private Keychain keychain;
    private String step;
    private String accountPassword;

    @Before
    public void setUp() {
        step = InstrumentationRegistry.getArguments().getString("flaky_step");
        accountPassword = InstrumentationRegistry.getArguments().getString("account_password");
        String passwordB64 = InstrumentationRegistry.getArguments().getString("account_password_b64");
        if (passwordB64 != null && !passwordB64.isEmpty()) {
            accountPassword = new String(
                    Base64.decode(passwordB64, Base64.DEFAULT),
                    StandardCharsets.UTF_8
            );
        }
        Assume.assumeTrue(BuildConfig.DEBUG);
        Assume.assumeTrue(
                "export".equals(step)
                        || "import_flaky".equals(step)
                        || "import_fix".equals(step)
                        || "probe".equals(step)
                        || "restore_last_known".equals(step)
        );
        reactContext = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        UniqueIdProvider.sharedInstance().init(reactContext);
        vaultManager = new VaultManagerModule(reactContext);
        keychain = new Keychain(reactContext);
    }

    @Test
    public void runStep() throws Exception {
        if ("export".equals(step)) {
            exportPassphraseVault();
        } else if ("import_flaky".equals(step)) {
            importPlant(true);
        } else if ("import_fix".equals(step)) {
            importPlant(false);
        } else if ("probe".equals(step)) {
            probePassphraseVault();
        } else {
            restoreLastKnownOnly();
        }
    }

    private void exportPassphraseVault() throws Exception {
        Assume.assumeNotNull(accountPassword);
        String deviceId = UniqueIdProvider.sharedInstance().getDeviceUniqueId();
        String realmKey = vaultManager.getStorageEncryptionKey();
        String vaultName = null;
        String secret = null;
        for (String alias : listVaultAliases()) {
            try {
                secret = vaultManager.openVault(alias, accountPassword, false);
                vaultName = alias;
                break;
            } catch (Exception ignored) {
                // try next alias (passcode vaults will not open with the account password)
            }
        }
        if (vaultName == null || secret == null) {
            throw new IllegalStateException("no vault opened with the given account password");
        }

        JSONObject json = new JSONObject();
        json.put("deviceId", deviceId);
        json.put("realmKey", realmKey);
        json.put("vaultName", vaultName);
        json.put("secret", secret);
        json.put("hashedKey", accountPassword);

        writeUtf8(exportFile(), json.toString());
    }

    private void importPlant(boolean breakDeviceId) throws Exception {
        JSONObject json = new JSONObject(readUtf8(exportFile()));
        String deviceId = json.getString("deviceId");
        String realmKey = json.getString("realmKey");
        String vaultName = json.getString("vaultName");
        String secret = json.getString("secret");
        String vaultKey = json.getString("hashedKey");

        UniqueIdProvider.sharedInstance().persistConfirmedDeviceUniqueId(deviceId);
        keychain.setItem(REALM_KEY_ALIAS, "", realmKey);
        vaultManager.createVault(vaultName, secret, vaultKey);

        if (breakDeviceId) {
            stripUniqueId();
            reactContext.getSharedPreferences(LAST_KNOWN_PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .clear()
                    .commit();
        }
    }

    private void restoreLastKnownOnly() throws Exception {
        JSONObject json = new JSONObject(readUtf8(exportFile()));
        String deviceId = json.getString("deviceId");
        UniqueIdProvider.sharedInstance().persistConfirmedDeviceUniqueId(deviceId);
        stripUniqueId();
        UniqueIdProvider.BindingHealth health = UniqueIdProvider.sharedInstance().inspectBinding();
        logLine(
                "restore_last_known lastKnownPresent=" + health.lastKnownPresent
                        + " uniqueIdKeychainReadable=" + health.uniqueIdKeychainReadable
                        + " lastKnownMatchesLive=" + health.lastKnownMatchesLive
        );
        if (!health.lastKnownPresent) {
            throw new IllegalStateException("last-known missing after restore");
        }
        if (health.uniqueIdKeychainReadable) {
            throw new IllegalStateException("unique-id keychain still readable after strip");
        }
        if (health.lastKnownMatchesLive) {
            throw new IllegalStateException("last-known matches live; migrate fallback would not run");
        }
        deleteExportFile();
    }

    private File exportFile() {
        return new File(reactContext.getFilesDir(), "flaky-export.json");
    }

    private void deleteExportFile() {
        File file = exportFile();
        if (file.exists() && !file.delete()) {
            logLine("WARN could not delete " + file.getAbsolutePath());
        }
    }

    private void probePassphraseVault() throws Exception {
        Assume.assumeNotNull(accountPassword);
        JSONObject json = new JSONObject(readUtf8(exportFile()));
        String vaultName = json.getString("vaultName");
        UniqueIdProvider.BindingHealth health = UniqueIdProvider.sharedInstance().inspectBinding();
        com.facebook.react.bridge.WritableMap inspect = vaultManager.buildVaultHealthReport();
        logLine(
                "probe health lastKnownPresent=" + health.lastKnownPresent
                        + " uniqueIdKeychainReadable=" + health.uniqueIdKeychainReadable
                        + " lastKnownMatchesLive=" + health.lastKnownMatchesLive
                        + " realmKeyReadable=" + inspect.getBoolean("realmKeyReadable")
                        + " vaultsPresent=" + inspect.getInt("vaultsPresent")
        );
        UniqueIdProvider.sharedInstance().clearLastUnlockReport();
        try {
            String secret = vaultManager.openVault(vaultName, accountPassword, false);
            UniqueIdProvider.DeviceIdUnlockReport report =
                    UniqueIdProvider.sharedInstance().consumeLastUnlockReport();
            logLine(
                    "probe OPEN_OK secret_len=" + (secret == null ? 0 : secret.length())
                            + " fallbackUsed=" + (report != null && report.fallbackUsed)
                            + " storedDifferedFromLive=" + (report != null && report.storedDifferedFromLive)
            );
        } catch (CryptoFailedException e) {
            logLine("probe OPEN_FAIL code=" + e.getCode() + " message=" + e.getMessage());
        } catch (Exception e) {
            logLine("probe OPEN_FAIL code=untyped message=" + e.getMessage());
        } finally {
            deleteExportFile();
        }
    }

    private void stripUniqueId() throws Exception {
        Thread.sleep(2000);
        if (keychain.itemExist(UNIQUE_ID_ALIAS)) {
            keychain.deleteItem(UNIQUE_ID_ALIAS);
        }
        Thread.sleep(500);
        if (keychain.itemExist(UNIQUE_ID_ALIAS)) {
            keychain.deleteItem(UNIQUE_ID_ALIAS);
        }
    }

    private static void logLine(String line) {
        Log.i(TAG, line);
        System.out.println(TAG + " " + line);
    }

    private java.util.List<String> listVaultAliases() {
        java.util.ArrayList<String> aliases = new java.util.ArrayList<>();
        SharedPreferences prefs = reactContext.getSharedPreferences("RN_KEYCHAIN", Context.MODE_PRIVATE);
        for (Map.Entry<String, ?> entry : prefs.getAll().entrySet()) {
            String key = entry.getKey();
            if (!key.endsWith(":c")) {
                continue;
            }
            String alias = key.substring(0, key.length() - 2);
            if (REALM_KEY_ALIAS.equals(alias) || UNIQUE_ID_ALIAS.equals(alias) || alias.endsWith("_RECOVER")) {
                continue;
            }
            aliases.add(alias);
        }
        return aliases;
    }

    private static void writeUtf8(File file, String value) throws Exception {
        FileOutputStream out = new FileOutputStream(file);
        try {
            out.write(value.getBytes(StandardCharsets.UTF_8));
        } finally {
            out.close();
        }
    }

    private static String readUtf8(File file) throws Exception {
        FileInputStream in = new FileInputStream(file);
        try {
            byte[] buf = new byte[(int) file.length()];
            int n = in.read(buf);
            return new String(buf, 0, n, StandardCharsets.UTF_8);
        } finally {
            in.close();
        }
    }
}
