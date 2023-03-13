

package libs.webview.events;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import org.jetbrains.annotations.NotNull;

/**
 * Event emitted when shouldOverrideUrlLoading is called
 */
public class TopShouldStartLoadWithRequestEvent extends Event<TopShouldStartLoadWithRequestEvent> {
    public static final String EVENT_NAME = "topShouldStartLoadWithRequest";
    final WritableMap mEventData;

    public TopShouldStartLoadWithRequestEvent(int viewId, WritableMap eventData) {
        super(viewId);

        eventData.putString("navigationType", "other");
        // Android does not raise shouldOverrideUrlLoading for inner frames
        eventData.putBoolean("isTopFrame", true);

        mEventData = eventData;
    }

    @NotNull
    public String getEventName() {
        return TopShouldStartLoadWithRequestEvent.EVENT_NAME;
    }

    public boolean canCoalesce() {
        return false;
    }

    public short getCoalescingKey() {
        return 0;
    }

    @Override
    public void dispatch(@NotNull RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(this.getViewTag(), this.getEventName(), this.mEventData);
    }
}


