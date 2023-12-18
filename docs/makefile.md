We've included a bunch of make commands in order to control the development flow and to ensure that everything works as expected. Always try and use these make commands unless they can't accomplish what you need to do.

Every make command has to be run from a terminal in the project's root directory. Try running **make help** to get a short description in your terminal about every make command available.

## Commands to Prepare the App

These make commands are used to install dependencies, to configure necessary steps before running or building the app, and to clean everything.

- **make pre-run**: Downloads and installs any project dependencies and sets up the app environment requirements to build and run the app. Run this command when setting up your environment or after a **make clean**.
- **make clean**: Removes all downloaded dependencies, clears the cache of those dependencies and deletes any builds that were created. It will not reset the repo, so your current changes will still be there.

## Commands to Run the App

These make commands are used to run the app on a device or emulator in the case of Android, and on a simulator in the case of iOS.

- **make start**: Runs the React Native packager server used to bundle the javascript code and leaves it running in your terminal. Use this if you have a compiled app already running in dev mode on a device, emulator or simulator and you have only made changes to your JavaScript code, so re-compiling the app isn't necessary.
- **make stop**: Stops the React Native packager server if it is running. This command is optional if you need to terminate the packager server from another terminal.
- **make run**: Alias of `run-ios`.
- **make run-ios**: Compiles and runs the app for iOS on an iPhone 6 simulator by default. You can set the environment variable SIMULATOR to the name of the device you want to use.
- **make run-android**: make run-android: Compiles and runs the app for Android on a running emulator or a device connected through USB. (see [Create and Manage Virtual Devices](https://developer.android.com/studio/run/managing-avds.html) to configure and run the Android emulator).

## Commands to Test the App

These make commands are used to ensure that the code follows the linter rules and that the tests work correctly.

- **make check-style**: Runs the ESLint JavaScript linter.
- **make test**: Runs the tests.
- **make test-e2e**: Runs Gray box end-to-end tests.


## Commands to Build the App

The set of commands for building the app are used in conjunction with [Fastlane](https://fastlane.tools/) and a set of environment variables that can be found under the project's fastlane directory.

- **make build**: Builds the app for both platforms Android and iOS in sequence and generates the apk and ipa files in the project's root directory to be distributed.
- **make build-ios**: Builds the iOS app and generates the ipa file in the project's root directory to be distributed.
- **make build-android**: Builds the Android app and generates the apk file in the project's root directory to be distributed.
- **make unsigned-ios**: Builds the iOS app and generates an unsigned Xaman-unsigned.ipa file in the project's root directory.
- **make unsigned-android**: Builds the Android app and generates an unsigned Xaman-unsigned.apk file in the project's root directory.

If you plan to use the make build-\* commands be sure to set your environment variables for use in conjunction with Fastlane to suit your needs.
