package libs.ui;

import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.WindowManager;
import android.widget.EditText;
import android.app.AlertDialog;

import androidx.annotation.NonNull;
import androidx.fragment.app.DialogFragment;

import javax.annotation.Nullable;


import com.xrpllabs.xumm.R;


public class PromptFragment extends DialogFragment implements DialogInterface.OnClickListener {
    static final String ARG_TITLE = "title";
    static final String ARG_MESSAGE = "message";
    static final String ARG_BUTTON_POSITIVE = "button_positive";
    static final String ARG_BUTTON_NEGATIVE = "button_negative";
    static final String ARG_BUTTON_NEUTRAL = "button_neutral";
    static final String ARG_ITEMS = "items";
    static final String ARG_TYPE = "type";
    static final String ARG_USER_INTERFACE_STYLE = "userInterfaceStyle";
    static final String ARG_DEFAULT_VALUE = "defaultValue";
    static final String ARG_PLACEHOLDER = "placeholder";

    private EditText mInputText;
    private
    @Nullable
    PromptModule.PromptFragmentListener mListener;

    public PromptFragment() {
        mListener = null;
    }

    public void setListener(@Nullable PromptModule.PromptFragmentListener listener) {
        mListener = listener;
    }

    public Dialog createDialog(Context activityContext, Bundle arguments) {
        AlertDialog.Builder builder;

        String userInterfaceStyle = arguments.containsKey(ARG_USER_INTERFACE_STYLE) ? arguments.getString(ARG_USER_INTERFACE_STYLE) : "default";


        switch (userInterfaceStyle) {
            case "dark":
                builder = new AlertDialog.Builder(activityContext, R.style.AlertDialogStyleDark);
                break;
            default:
                builder = new AlertDialog.Builder(activityContext, R.style.AlertDialogStyle);
                break;
        }

        builder.setTitle(arguments.getString(ARG_TITLE));

        if (arguments.containsKey(ARG_BUTTON_POSITIVE)) {
            builder.setPositiveButton(arguments.getString(ARG_BUTTON_POSITIVE), this);
        }
        if (arguments.containsKey(ARG_BUTTON_NEGATIVE)) {
            builder.setNegativeButton(arguments.getString(ARG_BUTTON_NEGATIVE), this);
        }
        if (arguments.containsKey(ARG_BUTTON_NEUTRAL)) {
            builder.setNeutralButton(arguments.getString(ARG_BUTTON_NEUTRAL), this);
        }
        // if both message and items are set, Android will only show the message
        // and ignore the items argument entirely
        if (arguments.containsKey(ARG_MESSAGE)) {
            builder.setMessage(arguments.getString(ARG_MESSAGE));
        }

        if (arguments.containsKey(ARG_ITEMS)) {
            builder.setItems(arguments.getCharSequenceArray(ARG_ITEMS), this);
        }

        AlertDialog alertDialog = builder.create();

        // input style
        LayoutInflater inflater = getLayoutInflater();
        final EditText input;


        switch (userInterfaceStyle) {
            case "dark":
                input = (EditText) inflater.inflate(R.layout.edit_text_dark, null);
                break;
            default:
                input = (EditText) inflater.inflate(R.layout.edit_text, null);
                break;
        }


        // input type
        int type = InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS;
        if (arguments.containsKey(ARG_TYPE)) {
            String typeString = arguments.getString(ARG_TYPE);
            if (typeString != null) {
                type = switch (typeString) {
                    case "secure-text" ->
                            InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD;
                    case "numeric" -> InputType.TYPE_CLASS_TEXT | InputType.TYPE_CLASS_NUMBER;
                    case "email-address" ->
                            InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS;
                    case "phone-pad" -> InputType.TYPE_CLASS_TEXT | InputType.TYPE_CLASS_PHONE;
                    default -> InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS;
                };
            }
        }
        input.setInputType(type);

        if (arguments.containsKey(ARG_DEFAULT_VALUE)) {
            String defaultValue = arguments.getString(ARG_DEFAULT_VALUE);
            if (defaultValue != null) {
                input.setText(defaultValue);
                int textLength = input.getText().length();
                input.setSelection(textLength, textLength);
            }
        }

        if (arguments.containsKey(ARG_PLACEHOLDER)) {
            input.setHint(arguments.getString(ARG_PLACEHOLDER));
        }
        alertDialog.setView(input, 50, 15, 50, 0);

        mInputText = input;
        return alertDialog;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        Dialog dialog = this.createDialog(getActivity(), getArguments());
        if (mInputText.requestFocus()) {
            dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
        }
        return dialog;
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
        if (mListener != null) {
            mListener.onConfirm(which, mInputText.getText().toString());
        }
    }

    @Override
    public void onDismiss(@NonNull DialogInterface dialog) {
        super.onDismiss(dialog);
        if (mListener != null) {
            mListener.onDismiss(dialog);
        }
    }

    public enum PromptTypes {
        TYPE_DEFAULT("default"),
        PLAIN_TEXT("plain-text"),
        SECURE_TEXT("secure-text"),
        NUMERIC("numeric"),
        EMAIL_ADDRESS("email-address"),
        PHONE_PAD("phone-pad");

        private final String mName;

        PromptTypes(final String name) {
            mName = name;
        }

        @NonNull
        @Override
        public String toString() {
            return mName;
        }
    }
}
