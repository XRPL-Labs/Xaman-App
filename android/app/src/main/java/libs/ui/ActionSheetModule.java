// Licence
// https://github.com/yfuks/react-native-action-sheet

package libs.ui;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.util.List;
import java.util.ArrayList;

import com.xrpllabs.xumm.R;

@ReactModule(name = PromptModule.NAME)
public class ActionSheetModule extends ReactContextBaseJavaModule {
    /* package */ static final String NAME = "ActionSheetAndroid";

    /* package */ static final String KEY_OPTIONS = "options";
    /* package */ static final String KEY_DESTRUCTIVE_BUTTON_INDEX = "destructiveButtonIndex";
    /* package */ static final String KEY_USERINTERFACE_STYLE = "userInterfaceStyle";

    /* package */ static final String THEME_LIGHT = "light";


    public ActionSheetModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }


    @ReactMethod
    public void showActionSheetWithOptions(final ReadableMap args, final Callback callback) {
        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null) {
            WritableMap response = Arguments.createMap();
            response.putString("error", "can't find current Activity");
            callback.invoke(response);
            return;
        }

        final List<String> titles = new ArrayList<String>();

        if (args.hasKey(KEY_OPTIONS)) {
            ReadableArray customButtons = args.getArray(KEY_OPTIONS);
            for (int i = 0; i < customButtons.size(); i++) {
                int currentIndex = titles.size();
                titles.add(currentIndex, customButtons.getString(i));
            }
        }

        int destructiveButtonIndex = -1;
        if (args.hasKey(KEY_DESTRUCTIVE_BUTTON_INDEX)) {
            destructiveButtonIndex = args.getInt(KEY_DESTRUCTIVE_BUTTON_INDEX);
        }
        int finalDestructiveButtonIndex = destructiveButtonIndex;


        String userInterfaceStyle = THEME_LIGHT;
        if (args.hasKey(KEY_USERINTERFACE_STYLE) &&
                args.getString(KEY_USERINTERFACE_STYLE) != null &&
                !args.getString(KEY_USERINTERFACE_STYLE).isEmpty()
        ) {
            userInterfaceStyle = args.getString(KEY_USERINTERFACE_STYLE);
        }
        String finalUserInterfaceStyle = userInterfaceStyle;

        ArrayAdapter<String> adapter = new ArrayAdapter<String>(currentActivity, R.layout.dialog_item, titles) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                TextView textView = (TextView) super.getView(position, convertView, parent);
                if (position == finalDestructiveButtonIndex) {
                    textView.setTextColor(Color.rgb(228,83,68));
                } else {
                    if (finalUserInterfaceStyle.equals(THEME_LIGHT)) {
                        textView.setTextColor(Color.BLACK);
                    } else {
                        textView.setTextColor(Color.WHITE);
                    }
                }
                return textView;
            }
        };

        int dialogStyle;
        if(finalUserInterfaceStyle.equals(THEME_LIGHT)){
            dialogStyle = R.style.DialogStyle;
        }else{
            dialogStyle = R.style.DialogStyleDark;
        }

        AlertDialog.Builder builder = new AlertDialog.Builder(currentActivity, dialogStyle);

        builder.setAdapter(adapter, new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int index) {
                callback.invoke(index);
            }
        });

        final AlertDialog dialog = builder.create();

        /**
         * override onCancel method to callback cancel in case of a touch outside of
         * the dialog or the BACK key pressed
         */
        dialog.setOnCancelListener(new DialogInterface.OnCancelListener() {
            @Override
            public void onCancel(DialogInterface dialog) {
                dialog.dismiss();
                callback.invoke();
            }
        });

        // show dialog
        dialog.show();
    }
}
