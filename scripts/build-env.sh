#!/usr/bin/env bash

CURRENT_DIR=$(pwd)

GOOGLESERVICE_JSON_PATH="${CURRENT_DIR}/android/app/google-services.json"
GOOGLESERVICE_INFO_PATH="${CURRENT_DIR}/ios/Xaman/GoogleService-Info.plist"

GOOGLESERVICE_JSON_CONTENT='{
  "project_info": {
    "project_number": "605969436814",
    "firebase_url": "https://mock-project-dbf72.firebaseio.com",
    "project_id": "mock-project-dbf72",
    "storage_bucket": "mock-project-dbf72.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:605969436814:android:dafa7cd40f21cc153af9df",
        "android_client_info": {
          "package_name": "com.xrpllabs.xumm"
        }
      },
      "oauth_client": [
        {
          "client_id": "605969436814-52cqhk0artfv0je48ud54hgqj9g2kf9q.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyCh03NeXbJVBFb9bmx0ZCwVtOwk2i6GOk8"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "605969436814-52cqhk0artfv0je48ud54hgqj9g2kf9q.apps.googleusercontent.com",
              "client_type": 3
            },
            {
              "client_id": "605969436814-fkagbvf14hpkum9k3get2hqckk4upa84.apps.googleusercontent.com",
              "client_type": 2,
              "ios_info": {
                "bundle_id": "com.xrpllabs.xumm"
              }
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
}'


GOOGLESERVICE_INFO_CONTENT='
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>605969436814-fkagbvf14hpkum9k3get2hqckk4upa84.apps.googleusercontent.com</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>com.googleusercontent.apps.605969436814-fkagbvf14hpkum9k3get2hqckk4upa84</string>
	<key>API_KEY</key>
	<string>AIzaSyDgFMurMEqDkIXF5V5RSjJdwtqySTPlDAw</string>
	<key>GCM_SENDER_ID</key>
	<string>605969436814</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.xrpllabs.xumm</string>
	<key>PROJECT_ID</key>
	<string>mock-project-dbf72</string>
	<key>STORAGE_BUCKET</key>
	<string>mock-project-dbf72.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>1:605969436814:ios:722fee6b295d63fd3af9df</string>
	<key>DATABASE_URL</key>
	<string>https://mock-project-dbf72.firebaseio.com</string>
</dict>
</plist>
'


if [ ! -f $GOOGLESERVICE_INFO_PATH ]; then
  echo "Note: No GoogleService-Info.plist file in ios app directory, creating placeholder..."
  echo $GOOGLESERVICE_INFO_CONTENT > $GOOGLESERVICE_INFO_PATH
fi

if [ ! -f $GOOGLESERVICE_JSON_PATH ]; then
  echo "Note: No google-services.json file in android app directory,  creating placeholder..."
  echo $GOOGLESERVICE_JSON_CONTENT > $GOOGLESERVICE_JSON_PATH
fi
