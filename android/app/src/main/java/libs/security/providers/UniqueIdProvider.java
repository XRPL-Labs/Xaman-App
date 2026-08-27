package libs.security.providers;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import libs.security.crypto.Crypto;
import libs.security.vault.VaultManagerModule;
import libs.security.vault.storage.Keychain;

public class UniqueIdProvider {
    public static final String UNIQUE_DEVICE_ID_KEY = "device-unique-id";
    private static final String RECOVERY_SUFFIX = "_RECOVER";
    private static final String LAST_KNOWN_PREFS = "xaman_device_id";
    private static final String LAST_KNOWN_ANDROID_ID = "last_known_android_id";

    private Context applicationContent;
    private Keychain keychain;
    private DeviceIdUnlockReport lastUnlockReport;

    public static class DeviceIdUnlockReport {
        public boolean fallbackUsed;
        public boolean storedDifferedFromLive;
    }

    public synchronized UniqueIdProvider init(final ReactApplicationContext context) {
        if (context == null) {
            throw new IllegalArgumentException("Context is required");
        }

        applicationContent = context.getApplicationContext();
        keychain = new Keychain(context);

        return this;
    }

    public static UniqueIdProvider sharedInstance() {
        return SingletonHolder.instance;
    }

    private static class SingletonHolder {
        static final UniqueIdProvider instance = new UniqueIdProvider();
    }


    @SuppressLint("HardwareIds")
    private static String getAndroidId(Context context) {
        return Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
    }


    /**
     * Re-wrap device-unique-id only. Last-known prefs hold the same plaintext,
     * so a new Keystore key loses nothing. Never use this path for account
     * vaults or the Realm key.
     */
    private void saveDeviceUniqueId(String unique_id) {
        try {
            keychain.setItem(UNIQUE_DEVICE_ID_KEY, "", unique_id);
        } catch (Exception first) {
            try {
                if (keychain.itemExist(UNIQUE_DEVICE_ID_KEY)) {
                    keychain.deleteItem(UNIQUE_DEVICE_ID_KEY);
                }
                keychain.setItem(UNIQUE_DEVICE_ID_KEY, "", unique_id);
            } catch (Exception ignored) {
                // unique-id wrap stays broken; last-known prefs still hold the plaintext
            }
        }
    }

    /**
     * Keychain unique-id load. Prefs-present + unwrap-fail is not the same as first install.
     */
    static final class DeviceIdLoad {
        @Nullable
        final String value;
        final boolean present;
        final boolean readable;
        final boolean unreadable;

        private DeviceIdLoad(@Nullable final String value, final boolean present, final boolean readable) {
            this.value = value;
            this.present = present;
            this.readable = readable;
            this.unreadable = present && !readable;
        }

        static DeviceIdLoad absent() {
            return new DeviceIdLoad(null, false, false);
        }

        static DeviceIdLoad readable(@NonNull final String value) {
            return new DeviceIdLoad(value, true, true);
        }

        static DeviceIdLoad unreadable() {
            return new DeviceIdLoad(null, true, false);
        }
    }

    @NonNull
    private DeviceIdLoad loadDeviceUniqueIdDetailed() {
        if (keychain == null) {
            return DeviceIdLoad.absent();
        }
        try {
            if (!keychain.itemExist(UNIQUE_DEVICE_ID_KEY)) {
                return DeviceIdLoad.absent();
            }
            Map<String, String> item = keychain.getItem(UNIQUE_DEVICE_ID_KEY);
            if (item == null) {
                return DeviceIdLoad.unreadable();
            }
            String value = Objects.requireNonNull(item.get("password"));
            if (!isUsableAndroidId(value)) {
                return DeviceIdLoad.unreadable();
            }
            return DeviceIdLoad.readable(value);
        } catch (Exception e) {
            return DeviceIdLoad.unreadable();
        }
    }

    @Nullable
    private String loadDeviceUniqueId() {
        DeviceIdLoad load = loadDeviceUniqueIdDetailed();
        return load.readable ? load.value : null;
    }

    void saveLastKnownAndroidId(@NonNull final String unique_id) {
        saveLastKnownAndroidId(unique_id, false);
    }

    /**
     * @param durable commit() so last-known is on disk before a following Keychain wrap write.
     *                apply() is enough for opportunistic backfill.
     */
    private void saveLastKnownAndroidId(@NonNull final String unique_id, final boolean durable) {
        if (applicationContent == null) {
            return;
        }
        SharedPreferences.Editor editor = applicationContent
                .getSharedPreferences(LAST_KNOWN_PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(LAST_KNOWN_ANDROID_ID, unique_id);
        if (durable) {
            editor.commit();
        } else {
            editor.apply();
        }
    }

    /**
     * User wipe: drop last-known so the next install can bind to live ANDROID_ID.
     */
    public synchronized void clearLastKnownAndroidId() {
        if (applicationContent == null) {
            return;
        }
        applicationContent
                .getSharedPreferences(LAST_KNOWN_PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(LAST_KNOWN_ANDROID_ID)
                .commit();
    }

    @Nullable
    String loadLastKnownAndroidId() {
        if (applicationContent == null) {
            return null;
        }
        SharedPreferences prefs = applicationContent.getSharedPreferences(LAST_KNOWN_PREFS, Context.MODE_PRIVATE);
        String value = prefs.getString(LAST_KNOWN_ANDROID_ID, null);
        return TextUtils.isEmpty(value) ? null : value;
    }

    /**
     * Persist an ANDROID_ID that produced a successful vault encrypt or decrypt.
     * Never treat a failed unique-id unwrap as first install. That would cement live
     * ANDROID_ID into last-known and block Extra Security recovery.
     * Live ANDROID_ID bootstrap is only when unique-id is absent, last-known is empty,
     * and no account vault ciphertext exists yet.
     * provenByDecrypt: AES-GCM already opened a vault with this id. Write last-known
     * even when unique-id wrap is dead and last-known is empty.
     */
    public synchronized void persistConfirmedDeviceUniqueId(@NonNull final String unique_id) {
        persistConfirmedDeviceUniqueId(unique_id, false);
    }

    public synchronized void persistConfirmedDeviceUniqueId(
            @NonNull final String unique_id,
            final boolean provenByDecrypt
    ) {
        if (!isUsableAndroidId(unique_id)) {
            return;
        }
        byte[] incoming = toDeviceIdBytes(unique_id);
        if (incoming == null) {
            return;
        }
        DeviceIdLoad uniqueLoad = loadDeviceUniqueIdDetailed();
        byte[] storedUnique = uniqueLoad.readable ? toDeviceIdBytes(uniqueLoad.value) : null;
        byte[] storedLast = toDeviceIdBytes(loadLastKnownAndroidId());

        if (provenByDecrypt) {
            if (storedLast == null || !Arrays.equals(incoming, storedLast)) {
                saveLastKnownAndroidId(unique_id, true);
            }
            if (storedUnique == null || !Arrays.equals(incoming, storedUnique)) {
                saveDeviceUniqueId(unique_id);
            }
            return;
        }

        if (uniqueLoad.unreadable) {
            if (storedLast == null) {
                return;
            }
            if (!Arrays.equals(incoming, storedLast)) {
                return;
            }
            saveDeviceUniqueId(unique_id);
            return;
        }

        if (storedLast == null) {
            if (storedUnique == null) {
                if (hasPreexistingAccountVaults()) {
                    return;
                }
                saveLastKnownAndroidId(unique_id, true);
                storedLast = incoming;
            } else if (Arrays.equals(incoming, storedUnique)) {
                saveLastKnownAndroidId(unique_id, true);
                storedLast = incoming;
            }
        }

        if (storedLast != null && Arrays.equals(incoming, storedLast)) {
            if (storedUnique == null || !Arrays.equals(incoming, storedUnique)) {
                saveDeviceUniqueId(unique_id);
            }
        }
    }

    /**
     * True when RN_KEYCHAIN already has an account vault blob.
     * Unique-id and Realm key aliases are not account vaults.
     */
    boolean hasPreexistingAccountVaults() {
        if (keychain == null) {
            return false;
        }
        for (String alias : keychain.getAllAliases()) {
            if (UNIQUE_DEVICE_ID_KEY.equals(alias)
                    || VaultManagerModule.STORAGE_ENCRYPTION_KEY.equals(alias)
                    || alias.endsWith(RECOVERY_SUFFIX)) {
                continue;
            }
            if (keychain.itemExist(alias)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Startup only. Copy a readable unique-id into last-known before any encrypt.
     * Never writes live ANDROID_ID.
     */
    public synchronized void backfillLastKnownFromReadableUniqueId() {
        DeviceIdLoad load = loadDeviceUniqueIdDetailed();
        if (load.readable && load.value != null) {
            persistConfirmedDeviceUniqueId(load.value);
        }
    }

    /**
     * True only when a previous-boot last-known ANDROID_ID exists and live ANDROID_ID bytes differ.
     * False when there is nothing stored to compare.
     */
    public synchronized boolean isLastKnownDeviceIdChanged() {
        if (applicationContent == null) {
            return false;
        }
        byte[] stored = toDeviceIdBytes(loadLastKnownAndroidId());
        byte[] live = toDeviceIdBytes(getAndroidId(applicationContent));
        if (stored == null || live == null) {
            return false;
        }
        return !Arrays.equals(stored, live);
    }

    private static boolean isUsableAndroidId(@Nullable final String unique_id) {
        if (TextUtils.isEmpty(unique_id) || unique_id.equalsIgnoreCase("android_id")) {
            return false;
        }
        for (int i = 0; i < unique_id.length(); i++) {
            if (Character.digit(unique_id.charAt(i), 16) < 0) {
                return false;
            }
        }
        return true;
    }

    @Nullable
    public static byte[] toDeviceIdBytes(@Nullable final String deviceUniqueId) {
        if (!isUsableAndroidId(deviceUniqueId)) {
            return null;
        }

        StringBuilder uniqueId = new StringBuilder(deviceUniqueId);
        while (uniqueId.length() < 16) {
            uniqueId.insert(0, "0");
        }
        if ((uniqueId.length() & 0x01) != 0) {
            uniqueId.insert(0, "0");
        }

        try {
            return Crypto.HexToBytes(uniqueId.toString());
        } catch (RuntimeException e) {
            return null;
        }
    }

    /**
     * Candidate ANDROID_ID values for Cipher V2 decrypt, first match wins.
     * Order: Keychain unique-id, last-known plain prefs, live ANDROID_ID last.
     * Encrypt never uses this list. Existing vaults stay on the stored unique-id.
     * Live is last-resort decrypt and first-install only.
     * Deduped by padded bytes so leading-zero variants are tried once.
     */
    @NonNull
    public synchronized List<String> getDecryptCandidateIds() {
        if (applicationContent == null) {
            return new ArrayList<>();
        }

        LinkedHashMap<String, String> uniqueByBytes = new LinkedHashMap<>();
        addDecryptCandidate(uniqueByBytes, loadDeviceUniqueId());
        addDecryptCandidate(uniqueByBytes, loadLastKnownAndroidId());
        addDecryptCandidate(uniqueByBytes, getAndroidId(applicationContent));
        return new ArrayList<>(uniqueByBytes.values());
    }

    @Nullable
    public synchronized String getLiveAndroidId() {
        if (applicationContent == null) {
            return null;
        }
        String live = getAndroidId(applicationContent);
        return isUsableAndroidId(live) ? live : null;
    }

    public synchronized void clearLastUnlockReport() {
        lastUnlockReport = null;
    }

    /**
     * Record a successful Cipher V2 decrypt.
     * fallbackUsed is true when the winning id is not live ANDROID_ID.
     * Existing vaults stay on the stored unique-id. Live is not the encrypt id.
     */
    public synchronized void recordDecryptSuccess(@NonNull final String winningDeviceId) {
        DeviceIdUnlockReport report = new DeviceIdUnlockReport();
        byte[] liveBytes = toDeviceIdBytes(getLiveAndroidId());
        byte[] storedUnique = toDeviceIdBytes(loadDeviceUniqueId());
        byte[] storedLast = toDeviceIdBytes(loadLastKnownAndroidId());
        byte[] winningBytes = toDeviceIdBytes(winningDeviceId);
        report.storedDifferedFromLive = liveBytes != null
                && (
                        (storedUnique != null && !Arrays.equals(liveBytes, storedUnique))
                                || (storedLast != null && !Arrays.equals(liveBytes, storedLast))
                );
        report.fallbackUsed = winningBytes != null
                && liveBytes != null
                && !Arrays.equals(winningBytes, liveBytes);
        lastUnlockReport = report;
    }

    @Nullable
    public synchronized DeviceIdUnlockReport consumeLastUnlockReport() {
        DeviceIdUnlockReport report = lastUnlockReport;
        lastUnlockReport = null;
        return report;
    }

    private static void addDecryptCandidate(
            @NonNull final LinkedHashMap<String, String> uniqueByBytes,
            @Nullable final String unique_id
    ) {
        byte[] bytes = toDeviceIdBytes(unique_id);
        if (bytes == null) {
            return;
        }
        String bytesHex = Crypto.BytesToHex(bytes);
        if (!uniqueByBytes.containsKey(bytesHex)) {
            uniqueByBytes.put(bytesHex, unique_id);
        }
    }

    @Nullable
    public synchronized byte[] getDeviceUniqueIdBytes() {
        return toDeviceIdBytes(getDeviceUniqueId());
    }

    /**
     * Id used for encrypt, PIN HMAC, and as the stored unique-id.
     * Never return live ANDROID_ID when unique-id wrap is unreadable.
     * Live is first-install only (unique-id absent, last-known empty, no vault blobs).
     */
    @SuppressLint("HardwareIds")
    @Nullable
    public synchronized String getDeviceUniqueId() {
        if (applicationContent == null) {
            throw new RuntimeException("Context is required");
        }

        DeviceIdLoad uniqueLoad = loadDeviceUniqueIdDetailed();
        if (uniqueLoad.readable && isUsableAndroidId(uniqueLoad.value)) {
            if (loadLastKnownAndroidId() == null) {
                saveLastKnownAndroidId(uniqueLoad.value);
            }
            return uniqueLoad.value;
        }

        String unique_id = loadLastKnownAndroidId();
        if (isUsableAndroidId(unique_id)) {
            return unique_id;
        }

        if (uniqueLoad.unreadable || hasPreexistingAccountVaults()) {
            return null;
        }

        unique_id = getAndroidId(applicationContent);
        if (!isUsableAndroidId(unique_id)) {
            return null;
        }

        return unique_id;
    }

    public static class BindingHealth {
        public boolean lastKnownPresent;
        public boolean livePresent;
        public boolean lastKnownMatchesLive;
        public boolean uniqueIdKeychainReadable;
    }

    @NonNull
    public synchronized BindingHealth inspectBinding() {
        BindingHealth health = new BindingHealth();
        String live = getLiveAndroidId();
        String lastKnown = loadLastKnownAndroidId();
        health.livePresent = isUsableAndroidId(live);
        health.lastKnownPresent = isUsableAndroidId(lastKnown);
        health.lastKnownMatchesLive = health.livePresent
                && health.lastKnownPresent
                && Arrays.equals(toDeviceIdBytes(live), toDeviceIdBytes(lastKnown));
        health.uniqueIdKeychainReadable = loadDeviceUniqueIdDetailed().readable;
        return health;
    }
}
