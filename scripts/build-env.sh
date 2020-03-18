#!/usr/bin/env bash


echo "Checking Google Services files..."

GOOGLESERVICE_JSON_PATH="./android/app/google-services.json"
GOOGLESERVICE_INFO_PATH="./ios/XUMM/GoogleService-Info.plist"

GOOGLESERVICE_JSON_CONTENT='{\n
\t"project_info": {\n
\t\t"project_id": "sample",\n
\t\t"project_number": "000000000000",\n
\t\t"name": "sample",\n
\t\t"firebase_url": "https://sample.firebaseio.com"\n
\t},\n
\t"client": [\n
\t\t{\n
\t\t\t"client_info": {\n
\t\t\t\t"mobilesdk_app_id": "1:000000000000:android:ffffffffffffffff",\n
\t\t\t\t"client_id": "android:com.xrpllabs.xumm",\n
\t\t\t\t"client_type": 1,\n
\t\t\t\t"android_client_info": {\n
\t\t\t\t\t"package_name": "com.xrpllabs.xumm",\n
\t\t\t\t\t"certificate_hash": []\n
\t\t\t\t}\n
\t\t\t},\n
\t\t\t"api_key": [\n
\t\t\t\t{\n
\t\t\t\t\t"current_key": "sample"\n
\t\t\t\t}\n
\t\t\t]\n
\t\t}\n
\t],\n
\t"configuration_version": "1"\n
}'


GOOGLESERVICE_INFO_CONTENT='
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>AD_UNIT_ID_FOR_BANNER_TEST</key>
	<string>ca-app-pub-3940256099942544/2934735716</string>
	<key>AD_UNIT_ID_FOR_INTERSTITIAL_TEST</key>
	<string>ca-app-pub-3940256099942544/4411468910</string>
	<key>API_KEY</key>
	<string>AIzaSyAzlj4APqi5S58nFtE52Da-fYBOHA2MhaY</string>
	<key>BUNDLE_ID</key>
	<string>id</string>
	<key>CLIENT_ID</key>
	<string>123456789000-hjugbg6ud799v4c49dim8ce2usclthar.apps.googleusercontent.com</string>
	<key>DATABASE_URL</key>
	<string>https://mockproject-1234.firebaseio.com</string>
	<key>GCM_SENDER_ID</key>
	<string>123456789000</string>
	<key>GOOGLE_APP_ID</key>
	<string>1:123456789000:ios:f1bf012572b04063</string>
	<key>IS_ADS_ENABLED</key>
	<true/>
	<key>IS_ANALYTICS_ENABLED</key>
	<true/>
	<key>IS_APPINVITE_ENABLED</key>
	<true/>
	<key>IS_GCM_ENABLED</key>
	<true/>
	<key>IS_SIGNIN_ENABLED</key>
	<true/>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>PROJECT_ID</key>
	<string>mockproject-1234</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>com.googleusercontent.apps.123456789000-hjugbg6ud799v4c49dim8ce2usclthar</string>
	<key>STORAGE_BUCKET</key>
	<string>mockproject-1234.appspot.com</string>
</dict>
</plist>
'


if [ ! -f $GOOGLESERVICE_INFO_PATH ]; then
  echo "No GoogleService-Info.plist file in ios app directory, creating placeholder..."
  echo $GOOGLESERVICE_INFO_CONTENT > $GOOGLESERVICE_INFO_PATH
fi

if [ ! -f $GOOGLESERVICE_JSON_PATH ]; then
  echo "Warning: No google-services.json file in android app directory,  creating placeholder..."
  echo $GOOGLESERVICE_JSON_CONTENT > $GOOGLESERVICE_JSON_PATH
fi