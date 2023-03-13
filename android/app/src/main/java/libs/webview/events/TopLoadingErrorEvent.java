package libs.webview.events;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import org.jetbrains.annotations.NotNull;

/**
 * Event emitted when there is an error in loading.
 */
public class TopLoadingErrorEvent extends Event<TopLoadingErrorEvent> {
    public static final String EVENT_NAME = "topLoadingError";
    final WritableMap mEventData;

    public TopLoadingErrorEvent(int viewId, WritableMap eventData) {
        super(viewId);
        mEventData = eventData;
    }

    @NotNull
    public String getEventName() {
        return TopLoadingErrorEvent.EVENT_NAME;
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

