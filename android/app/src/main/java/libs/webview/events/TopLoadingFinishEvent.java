package libs.webview.events;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import org.jetbrains.annotations.NotNull;

/**
 * Event emitted when loading is completed.
 */
public class TopLoadingFinishEvent extends Event<TopLoadingFinishEvent> {
  public static final String EVENT_NAME = "topLoadingFinish";
  final WritableMap mEventData;

  public TopLoadingFinishEvent(int viewId, WritableMap eventData) {
    super(viewId);
    mEventData = eventData;
  }

  @NotNull
  public String getEventName() {
    return TopLoadingFinishEvent.EVENT_NAME;
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

