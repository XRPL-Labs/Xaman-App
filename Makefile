.PHONY: pre-run pre-build clean
.PHONY: validate-style
.PHONY: start stop
.PHONY: run run-ios run-android
.PHONY: build build-ios build-android unsigned-ios unsigned-android ios-sim-x86_64
.PHONY: build-pr can-build-pr prepare-pr
.PHONY: test help

OS := $(shell sh -c 'uname -s 2>/dev/null')
SIMULATOR = iPhone 15 Pro Max


node_modules: package.json
	@if ! [ $(shell which npm 2> /dev/null) ]; then \
		echo "npm is not installed https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"; \
		exit 1; \
	fi

	@if npm check | grep -Eq "from the root project|npm ERR! missing:"; then \
		echo "Update/Install dependencies required, please run 'make npm-install'"; \
		exit 1; \
	fi

npm-install: package.json
	@if ! [ $(shell which npm 2> /dev/null) ]; then \
		echo "npm is not installed https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"; \
		exit 1; \
	fi

	@echo Getting Javascript dependencies
	@npm install --frozen-lockfile

.podinstall:
ifeq ($(OS), Darwin)
	@echo "Required version of Cocoapods is not installed"
	@echo Installing gems;
	@bundle install
	@echo Getting Cocoapods dependencies;w
	@cd ios && bundle exec pod install;
endif
	@touch $@

build-env:
	@echo "Generating build environment"
	@./scripts/build-env.sh

pre-run: | node_modules .podinstall build-env ## Installs dependencies

pre-build: | node_modules .podinstall build-env ## Install dependencies before building

validate-style: node_modules ## Runs eslint
	@echo Checking for style guide compliance
	@npm run validate

clean: ## Cleans dependencies, previous builds and temp files
	@echo Cleaning started

	@rm -f .podinstall
	@rm -rf ios/Pods
	@rm -rf node_modules
	@rm -rf ios/build
	@rm -rf android/app/build

	@echo Cleanup finished

post-install:
	@./scripts/post-install.sh

start: | pre-run ## Starts the React Native packager server
	$(call start_packager)

stop: ## Stops the React Native packager server
	$(call stop_packager)

check-device-ios:
	@if ! [ $(shell which xcodebuild) ]; then \
		echo "xcode is not installed"; \
		exit 1; \
	fi
	@if ! [ $(shell which watchman) ]; then \
		echo "watchman is not installed"; \
		exit 1; \
	fi

check-device-android:
	@if ! [ $(ANDROID_HOME) ]; then \
		echo "ANDROID_HOME is not set"; \
		exit 1; \
	fi
	@if ! [ $(shell which adb 2> /dev/null) ]; then \
		echo "adb is not installed"; \
		exit 1; \
	fi

	@if ! [ $(shell which watchman 2> /dev/null) ]; then \
		echo "watchman is not installed"; \
		exit 1; \
	fi

	@while [ -z "$(shell adb devices | grep -w device)" ]; do \
		echo "Waiting for Android device to be connected..."; \
		sleep 5; \
	done

run: run-ios ## alias for run-ios

run-ios: | check-device-ios pre-run ## Runs the app on an iOS simulator
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 0 ]; then \
		echo Starting React Native packager server; \
		npm start;\
	fi;\
	echo Running iOS app in development; \
	if [ ! -z "${SIMULATOR}" ]; then \
		npx react-native run-ios --simulator="${SIMULATOR}"; \
	else \
		npx react-native run-ios; \
	fi; \


run-android: | check-device-android pre-run ## Runs the app on an Android emulator or dev device
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 0 ]; then \
		echo Starting React Native packager server; \
		npm start; \
	fi;\

	VARIANT=${VARIANT:-debug}; \
	echo Running Android app in ${VARIANT}; \

	@for device in $(shell adb devices | tail -n +2 | cut -sf 1); do \
		export ANDROID_SERIAL=$$device ; \
		npx react-native run-android --main-activity LaunchActivity --no-packager --mode=${VARIANT}; \
	done

build-ios: | stop pre-build validate-style ## Builds the iOS app
	$(call start_packager)
	@echo "Building iOS app"
	@cd ios
	@xcodebuild -scheme Xaman archivexcodebuild -scheme Xaman archive
	$(call stop_packager)

build-android: | stop pre-build validate-style ## Build the Android app
	@echo "Building Android app"
	@npx react-native build-android --mode=release

pre-e2e: | pre-build  ## build for e2e test
	@npx detox build e2e --configuration ios.sim

test: | pre-run validate-style ## Runs tests
	@npm run test

test-e2e: ## Runs e2e tests
	@npx detox clean-framework-cache
	@npx detox build-framework-cache
	@npx cucumber-js ./e2e --configuration android.attached
	@#npx cucumber-js ./e2e --configuration ios.sim

bump-build-number: ## Bump build number for Android and iOS
	@./scripts/bump-build-number.sh

## Help documentation https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

define start_packager
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 0 ]; then \
		echo Starting React Native packager server; \
		npm start & echo; \
	else \
		echo React Native packager server already running; \
	fi
endef

define stop_packager
	@echo Stopping React Native packager server
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 1 ]; then \
		ps -ef | grep -i "cli.js start" | grep -iv grep | awk '{print $$2}' | xargs kill -9; \
		echo React Native packager server stopped; \
	else \
		echo No React Native packager server running; \
	fi
endef
