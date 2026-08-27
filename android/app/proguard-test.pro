# Instrumentation APK is minified with the release build type.
# Keep JUnit/Detox or AndroidJUnitRunner crashes:
#   NoClassDefFoundError: org.junit.runner.notification.RunListener
-dontobfuscate
-dontshrink
-keep class org.junit.** { *; }
-keep class junit.** { *; }
-keep class org.hamcrest.** { *; }
-keep class androidx.test.** { *; }
-keep class com.wix.detox.** { *; }
-dontwarn org.junit.**
-dontwarn junit.**
-dontwarn org.hamcrest.**
-dontwarn androidx.test.**
-dontwarn com.wix.detox.**
