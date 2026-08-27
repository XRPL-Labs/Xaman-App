package libs.security.providers;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.facebook.react.bridge.ReactApplicationContext;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.List;

import libs.security.crypto.Crypto;
import libs.security.vault.storage.Keychain;

@RunWith(AndroidJUnit4.class)
public class UniqueIdProviderTest {
    @Before
    public void setUp() {
        UniqueIdProvider.sharedInstance().init(
                new ReactApplicationContext(
                        InstrumentationRegistry.getInstrumentation().getTargetContext()
                )
        );
    }

    @Test
    public void toDeviceIdBytesPadsLeadingZeros() {
        byte[] padded = UniqueIdProvider.toDeviceIdBytes("aabbccddeeff001");
        byte[] full = UniqueIdProvider.toDeviceIdBytes("0aabbccddeeff001");

        Assert.assertNotNull(padded);
        Assert.assertEquals(8, padded.length);
        Assert.assertArrayEquals(full, padded);
        Assert.assertNull(UniqueIdProvider.toDeviceIdBytes("android_id"));
        Assert.assertNull(UniqueIdProvider.toDeviceIdBytes("not-hex"));
    }

    @Test
    public void clearLastKnownAndroidIdRemovesPref() {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        provider.saveLastKnownAndroidId(liveId);
        Assert.assertNotNull(provider.loadLastKnownAndroidId());
        provider.clearLastKnownAndroidId();
        Assert.assertNull(provider.loadLastKnownAndroidId());
    }

    @Test
    public void persistConfirmedWritesLastKnownAndCandidatesIncludeIt() {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String deviceId = provider.getDeviceUniqueId();
        Assert.assertNotNull(deviceId);

        provider.persistConfirmedDeviceUniqueId(deviceId);

        Assert.assertEquals(deviceId, provider.loadLastKnownAndroidId());

        List<String> candidates = provider.getDecryptCandidateIds();
        Assert.assertFalse(candidates.isEmpty());

        boolean found = false;
        for (String candidate : candidates) {
            byte[] candidateBytes = UniqueIdProvider.toDeviceIdBytes(candidate);
            byte[] deviceBytes = UniqueIdProvider.toDeviceIdBytes(deviceId);
            if (java.util.Arrays.equals(candidateBytes, deviceBytes)) {
                found = true;
                break;
            }
        }
        Assert.assertTrue(found);
    }

    @Test
    public void lastKnownDeviceIdChangedOnlyWhenStoredAndLiveDiffer() {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        String previous = provider.loadLastKnownAndroidId();
        try {
            provider.saveLastKnownAndroidId(liveId);
            Assert.assertFalse(provider.isLastKnownDeviceIdChanged());

            provider.saveLastKnownAndroidId("ffffffffffffffff");
            Assert.assertTrue(provider.isLastKnownDeviceIdChanged());
        } finally {
            if (previous != null) {
                provider.saveLastKnownAndroidId(previous);
            }
        }
    }

    @Test
    public void persistConfirmedDoesNotBootstrapLiveWhenAccountVaultsExist() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        Keychain keychain = new Keychain(context);
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        final String dummyVault = "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899";
        try {
            if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
            context.getSharedPreferences("xaman_device_id", android.content.Context.MODE_PRIVATE)
                    .edit()
                    .clear()
                    .commit();
            keychain.setItem(dummyVault, "", "placeholder");
            Assert.assertTrue(provider.hasPreexistingAccountVaults());
            provider.persistConfirmedDeviceUniqueId(liveId);
            Assert.assertNull(provider.loadLastKnownAndroidId());
        } finally {
            if (keychain.itemExist(dummyVault)) {
                keychain.deleteItem(dummyVault);
            }
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void getDeviceUniqueIdDoesNotReturnLiveWhenAccountVaultsExist() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        Keychain keychain = new Keychain(context);
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        final String dummyVault = "ccddeeff00112233445566778899aabbccddeeff00112233445566778899aabb";
        try {
            if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
            context.getSharedPreferences("xaman_device_id", android.content.Context.MODE_PRIVATE)
                    .edit()
                    .clear()
                    .commit();
            keychain.setItem(dummyVault, "", "placeholder");
            Assert.assertNull(provider.getDeviceUniqueId());
        } finally {
            if (keychain.itemExist(dummyVault)) {
                keychain.deleteItem(dummyVault);
            }
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void persistConfirmedDoesNotReplaceStoredIdWithADifferentId() {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String beforeLast = provider.loadLastKnownAndroidId();
        String beforeUnique = provider.getDeviceUniqueId();
        Assert.assertNotNull(beforeUnique);

        provider.persistConfirmedDeviceUniqueId("ffffffffffffffff");

        Assert.assertArrayEquals(
                UniqueIdProvider.toDeviceIdBytes(beforeLast != null ? beforeLast : beforeUnique),
                UniqueIdProvider.toDeviceIdBytes(provider.loadLastKnownAndroidId())
        );
        Assert.assertArrayEquals(
                UniqueIdProvider.toDeviceIdBytes(beforeUnique),
                UniqueIdProvider.toDeviceIdBytes(provider.getDeviceUniqueId())
        );
    }

    @Test
    public void decryptCandidatesTryStoredIdBeforeLive() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        Keychain keychain = new Keychain(context);
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        try {
            keychain.setItem("device-unique-id", "", "aaaaaaaaaaaaaaaa");
            provider.saveLastKnownAndroidId("bbbbbbbbbbbbbbbb");

            List<String> candidates = provider.getDecryptCandidateIds();
            Assert.assertTrue(candidates.size() >= 2);
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes("aaaaaaaaaaaaaaaa"),
                    UniqueIdProvider.toDeviceIdBytes(candidates.get(0))
            );
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes("bbbbbbbbbbbbbbbb"),
                    UniqueIdProvider.toDeviceIdBytes(candidates.get(1))
            );
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes(liveId),
                    UniqueIdProvider.toDeviceIdBytes(candidates.get(candidates.size() - 1))
            );
        } finally {
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void getDeviceUniqueIdUsesLastKnownWhenUniqueIdMissing() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        Keychain keychain = new Keychain(new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        ));
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        try {
            if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
            provider.saveLastKnownAndroidId("aaaaaaaaaaaaaaaa");
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes("aaaaaaaaaaaaaaaa"),
                    UniqueIdProvider.toDeviceIdBytes(provider.getDeviceUniqueId())
            );
        } finally {
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void persistConfirmedHealsUniqueIdToLastKnown() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        Keychain keychain = new Keychain(new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        ));
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        try {
            keychain.setItem("device-unique-id", "", "bbbbbbbbbbbbbbbb");
            provider.saveLastKnownAndroidId("aaaaaaaaaaaaaaaa");
            provider.persistConfirmedDeviceUniqueId("aaaaaaaaaaaaaaaa");
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes("aaaaaaaaaaaaaaaa"),
                    UniqueIdProvider.toDeviceIdBytes(provider.loadLastKnownAndroidId())
            );
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes("aaaaaaaaaaaaaaaa"),
                    UniqueIdProvider.toDeviceIdBytes(provider.getDeviceUniqueId())
            );
        } finally {
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void persistConfirmedDoesNotWriteLiveOverDifferentLastKnown() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        Keychain keychain = new Keychain(new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        ));
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        try {
            keychain.setItem("device-unique-id", "", liveId);
            provider.saveLastKnownAndroidId("aaaaaaaaaaaaaaaa");
            provider.persistConfirmedDeviceUniqueId(liveId);
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes("aaaaaaaaaaaaaaaa"),
                    UniqueIdProvider.toDeviceIdBytes(provider.loadLastKnownAndroidId())
            );
        } finally {
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void getDeviceUniqueIdCacheMissDoesNotPersistLive() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        Keychain keychain = new Keychain(context);
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        try {
            if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
            context.getSharedPreferences("xaman_device_id", android.content.Context.MODE_PRIVATE)
                    .edit()
                    .clear()
                    .commit();
            String returned = provider.getDeviceUniqueId();
            Assert.assertNull(provider.loadLastKnownAndroidId());
            Assert.assertFalse(keychain.itemExist("device-unique-id"));
            if (provider.hasPreexistingAccountVaults()) {
                Assert.assertNull(returned);
            } else {
                Assert.assertArrayEquals(
                        UniqueIdProvider.toDeviceIdBytes(liveId),
                        UniqueIdProvider.toDeviceIdBytes(returned)
                );
            }
        } finally {
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void getDeviceUniqueIdUsesStoredIdNotLive() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        Keychain keychain = new Keychain(context);
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        try {
            keychain.setItem("device-unique-id", "", "aaaaaaaaaaaaaaaa");
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes("aaaaaaaaaaaaaaaa"),
                    UniqueIdProvider.toDeviceIdBytes(provider.getDeviceUniqueId())
            );
            Assert.assertFalse(
                    java.util.Arrays.equals(
                            UniqueIdProvider.toDeviceIdBytes(liveId),
                            UniqueIdProvider.toDeviceIdBytes("aaaaaaaaaaaaaaaa")
                    )
            );
        } finally {
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void decryptSuccessWithStoredAfterLiveFailSetsFallbackReport() {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        String previous = provider.loadLastKnownAndroidId();
        try {
            provider.saveLastKnownAndroidId("ffffffffffffffff");
            provider.recordDecryptSuccess("ffffffffffffffff");
            UniqueIdProvider.DeviceIdUnlockReport report = provider.consumeLastUnlockReport();
            Assert.assertNotNull(report);
            Assert.assertTrue(report.storedDifferedFromLive);
            Assert.assertTrue(report.fallbackUsed);
            Assert.assertNull(provider.consumeLastUnlockReport());
        } finally {
            if (previous != null) {
                provider.saveLastKnownAndroidId(previous);
            }
        }
    }

    @Test
    public void persistWithoutDecryptProofDoesNotFillLastKnownWhenUniqueIdUnreadable() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        Keychain keychain = new Keychain(context);
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        final String dummyVault = "ddeeff00112233445566778899aabbccddeeff00112233445566778899aabbcc";
        try {
            keychain.setItem("device-unique-id", "", "not-hex");
            context.getSharedPreferences("xaman_device_id", android.content.Context.MODE_PRIVATE)
                    .edit()
                    .clear()
                    .commit();
            keychain.setItem(dummyVault, "", "placeholder");
            Assert.assertTrue(provider.hasPreexistingAccountVaults());
            Assert.assertNull(provider.getDeviceUniqueId());
            provider.persistConfirmedDeviceUniqueId(liveId, false);
            Assert.assertNull(provider.loadLastKnownAndroidId());
            Assert.assertNull(provider.getDeviceUniqueId());
        } finally {
            if (keychain.itemExist(dummyVault)) {
                keychain.deleteItem(dummyVault);
            }
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void persistProvenByDecryptFillsLastKnownWhenUniqueIdUnreadable() throws Exception {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String liveId = provider.getLiveAndroidId();
        Assert.assertNotNull(liveId);
        ReactApplicationContext context = new ReactApplicationContext(
                InstrumentationRegistry.getInstrumentation().getTargetContext()
        );
        Keychain keychain = new Keychain(context);
        String previousLast = provider.loadLastKnownAndroidId();
        java.util.Map<String, String> previousUnique = keychain.itemExist("device-unique-id")
                ? keychain.getItem("device-unique-id")
                : null;
        final String dummyVault = "eeff00112233445566778899aabbccddeeff00112233445566778899aabbccdd";
        try {
            keychain.setItem("device-unique-id", "", "not-hex");
            context.getSharedPreferences("xaman_device_id", android.content.Context.MODE_PRIVATE)
                    .edit()
                    .clear()
                    .commit();
            keychain.setItem(dummyVault, "", "placeholder");
            Assert.assertNull(provider.getDeviceUniqueId());
            provider.persistConfirmedDeviceUniqueId(liveId, true);
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes(liveId),
                    UniqueIdProvider.toDeviceIdBytes(provider.loadLastKnownAndroidId())
            );
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes(liveId),
                    UniqueIdProvider.toDeviceIdBytes(provider.getDeviceUniqueId())
            );
            provider.persistConfirmedDeviceUniqueId(liveId, true);
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes(liveId),
                    UniqueIdProvider.toDeviceIdBytes(provider.loadLastKnownAndroidId())
            );
            Assert.assertArrayEquals(
                    UniqueIdProvider.toDeviceIdBytes(liveId),
                    UniqueIdProvider.toDeviceIdBytes(provider.getDeviceUniqueId())
            );
        } finally {
            if (keychain.itemExist(dummyVault)) {
                keychain.deleteItem(dummyVault);
            }
            if (previousLast != null) {
                provider.saveLastKnownAndroidId(previousLast);
            }
            if (previousUnique != null && previousUnique.get("password") != null) {
                keychain.setItem("device-unique-id", "", previousUnique.get("password"));
            } else if (keychain.itemExist("device-unique-id")) {
                keychain.deleteItem("device-unique-id");
            }
        }
    }

    @Test
    public void decryptCandidatesDedupeByPaddedBytes() {
        UniqueIdProvider provider = UniqueIdProvider.sharedInstance();
        String deviceId = provider.getDeviceUniqueId();
        Assert.assertNotNull(deviceId);

        provider.persistConfirmedDeviceUniqueId(deviceId);

        List<String> candidates = provider.getDecryptCandidateIds();
        java.util.HashSet<String> bytesHex = new java.util.HashSet<>();
        for (String candidate : candidates) {
            byte[] bytes = UniqueIdProvider.toDeviceIdBytes(candidate);
            Assert.assertNotNull(bytes);
            Assert.assertTrue(bytesHex.add(Crypto.BytesToHex(bytes)));
        }
    }
}
