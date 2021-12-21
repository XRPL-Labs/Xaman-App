package libs.ui;

import android.app.Activity;
import android.graphics.Rect;
import android.graphics.drawable.ColorDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewTreeObserver.OnGlobalLayoutListener;
import android.view.WindowManager.LayoutParams;
import android.widget.PopupWindow;

import java.util.Timer;
import java.util.TimerTask;

public class KeyboardProvider extends PopupWindow implements OnGlobalLayoutListener {
    private final Activity mActivity;
    private final View rootView;

    private HeightListener listener;
    private int heightMax;

    private Timer eventTimer;

    public KeyboardProvider(Activity activity) {
        super(activity);
        this.mActivity = activity;

        rootView = new View(activity);
        setContentView(rootView);

        rootView.getViewTreeObserver().addOnGlobalLayoutListener(this);
        setBackgroundDrawable(new ColorDrawable(0));

        setWidth(0);
        setHeight(LayoutParams.MATCH_PARENT);

        setSoftInputMode(LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        setInputMethodMode(PopupWindow.INPUT_METHOD_NEEDED);
    }

    public KeyboardProvider init() {

        if (!isShowing()) {
            final View view = mActivity.getWindow().getDecorView();
            showAtLocation(view, Gravity.NO_GRAVITY, 0, 0);
        }
        return this;
    }

    public void setHeightListener(HeightListener listener) {
        this.listener = listener;
    }

    @Override
    public void onGlobalLayout() {
        Rect rect = new Rect();
        rootView.getWindowVisibleDisplayFrame(rect);

        // calculate the keyboard height
        if (rect.bottom > heightMax) {
            heightMax = rect.bottom;
        }
        int keyboardHeight = heightMax - rect.bottom;

        // send the height change event
        sendHeightChangeEvent(keyboardHeight);
    }

    private void sendHeightChangeEvent(int height){
        if(eventTimer != null){
            eventTimer.cancel();
            eventTimer.purge();
            eventTimer = null;
        }
        eventTimer = new Timer();
        eventTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                if (listener != null) {
                    listener.onHeightChanged(height);
                }
            }
        }, 100L);

    }

    public interface HeightListener {
        void onHeightChanged(int height);
    }

    public void onDestroy(){
        dismiss();
    }
}