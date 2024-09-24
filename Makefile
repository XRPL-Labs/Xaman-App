.EXPORT_ALL_VARIABLES:
.PHONY: clean validate-style start stop run run-ios run-android build build-ios build-android lear test help test-e2e

OS := $(shell sh -c 'uname -s 2>/dev/null')
VARIANT ?= Debug
SIMULATOR ?= iPhone 15 Pro Max
DETOX_CONFIGURATION ?= ios.simulator+xaman.ios

# Function definitions ============================
define start_packager
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 0 ]; then \
		echo Starting React Native packager server; \
		npm start & echo; \
	fi
endef

define stop_packager
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 1 ]; then \
		ps -ef | grep -i "cli.js start" | grep -iv grep | awk '{print $$2}' | xargs kill -9; \
		echo React Native packager server stopped; \
	fi
endef

# New function to check if a command exists in the system
define check_command_exist
    @if ! [ $(shell which $(1) 2> /dev/null) ]; then \
        echo "$(1) command is not found. Please, ensure it is installed."; \
        exit 1; \
    fi
endef

# Private Targets ===========================================
.node_modules: package.json ## Check if we need to install the npm packages
	@if ! [ $(shell which npm 2> /dev/null) ]; then \
    		@echo "npm is not installed https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"; \
    		exit 1; \
	fi

	@if npm list --depth=0 | grep -Eq "from the root project|npm ERR! missing:"; then \
		@echo "Update/Install dependencies required, please install node dependencies"; \
		exit 1; \
	fi

.build_env: ## Run script for building the env files
	@./scripts/build-env.sh

.pre-android: ## Check if all requirements is met for running/building android version
	@if ! [ $(ANDROID_HOME) ]; then \
		@echo "$ANDROID_HOME is not set in $PATH env"; \
		exit 1; \
	fi

	@if ! [ $(shell which adb 2> /dev/null) ]; then \
		@echo "adb is not installed"; \
		exit 1; \
	fi

.pre-ios: ## Check if all requirements is met for running/building ios version
ifeq ($(OS), Darwin)
	@bundle install
	@cd ios && bundle exec pod install;
endif
	@touch $@

.pre-run: | .node_modules .build_env # Check if everything is ready for running/building the app

# Public Targets ===========================================
validate-style: .node_modules ## Runs eslint
	@echo Checking for style guide compliance
	@npm run validate

clean: ## Cleans dependencies, previous builds and temp files
	@rm -f .podinstall
	@rm -rf ios/Pods
	@rm -rf node_modules
	@rm -rf ios/build
	@rm -rf android/app/build

	@echo Done :+1:

start: | .pre-run ## Starts the React Native packager server
	$(call start_packager)

stop: | .pre-run ## Stops the React Native packager server
	$(call stop_packager)

run: run-ios ## alias for run-ios

run-ios: | .pre-run .pre-ios ## Runs the app on an iOS simulator
	$(call start_packager)

	@echo Running iOS app in ${VARIANT}
	@npx react-native run-ios --simulator="${SIMULATOR}" --mode=${VARIANT}

run-android: | .pre-run .pre-ios ## Runs the app on an Android emulator or dev device
	$(call start_packager)

	@while [ -z "$(shell adb devices | grep -w device)" ]; do \
		echo "Waiting for Android device to be connected..."; \
		sleep 5; \
	done

	@echo Running Android app in ${VARIANT} mode

	@for device in $(shell adb devices | tail -n +2 | cut -sf 1); do \
		export ANDROID_SERIAL=$$device ; \
		npx react-native run-android --main-activity LaunchActivity --no-packager --mode=${VARIANT}; \
	done

build-ios: | stop .pre-run .pre-ios ## Builds the iOS app
	@echo Building iOS app in ${VARIANT} mode;
	@npx react-native build-ios --mode=${VARIANT}

build-android: | stop .pre-run .pre-android ## Build the Android app
	@echo Building Android app in ${VARIANT} mode;
	@npx react-native build-android --mode=${VARIANT};

test: | .pre-run
	@npm run test

test-e2e: | .pre-run ## Runs e2e tests
	@npx detox clean-framework-cache;
	@npx detox build-framework-cache;
	@npx detox build e2e --configuration ${DETOX_CONFIGURATION} --if-missing;
	@npx cucumber-js ./e2e test;

bump-build-number: ## Bump build number for Android and iOS
	@./scripts/bump-build-number.sh;

## Help documentation https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
