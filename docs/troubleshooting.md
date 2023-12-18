#### Errors When Running 'make run-android'

##### Error message
```sh
Execution failed for task ':app:packageAllDebugClassesForMultiDex'.
> java.util.zip.ZipException: duplicate entry: android/support/v7/appcompat/R$anim.class
```

##### Solution
Clean the Android part of the Xaman project. Issue the following commands:

1. ``cd android``
2. ``./gradlew clean``

##### Error message
```sh
Execution failed for task ':app:installDebug'.
> com.android.builder.testing.api.DeviceException: com.android.ddmlib.InstallException: Failed to finalize session : INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package signatures do not match the previously installed version; ignoring!
```

##### Solution
The development version of the Xaman app cannot be installed alongside a release version. Open ``android/app/build.gradle`` and change the applicationId to a unique string for your app.

#### Errors When Running 'make run-ios'

##### Error message
```sh
xcrun: error: unable to find utility "instruments", not a developer tool or in PATH
```

##### Solution

- Launch XCode and agree to the terms first.
- Go to **Preferences -> Locations** and you'll see an option to select a version of the Command Line Tools. Click the select box and choose any version to use.

- After this go back to the command line and run ``make run-ios`` again.
