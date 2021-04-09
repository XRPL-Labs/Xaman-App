package libs.notification;

import com.xrpllabs.xumm.R;

import android.os.SystemClock;
import android.os.Build;

import android.content.Intent;
import android.content.SharedPreferences;

import android.app.PendingIntent;
import android.app.NotificationChannel;
import android.app.NotificationManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import com.google.firebase.messaging.RemoteMessage;

import androidx.core.app.NotificationCompat;

import me.leolin.shortcutbadger.ShortcutBadger;

public class LocalNotificationModule extends ReactContextBaseJavaModule {
    private static final String BADGE_FILE = "BadgeCountFile";
    private static final String BADGE_KEY = "BadgeCount";

    private final ReactApplicationContext context;
    private SharedPreferences sharedPreferences = null;


    public LocalNotificationModule(ReactApplicationContext context) {
        super(context);
        this.context = context;

        sharedPreferences = context.getSharedPreferences(BADGE_FILE, context.MODE_PRIVATE);

    }

    @Override
    public String getName() {
        return "LocalNotificationModule";
    }


    @ReactMethod
    public void complete(String handlerKey, Boolean show) {
        RemoteMessage remoteMessage = NotificationMessageReceiver.notifications.get(handlerKey);

        if (remoteMessage != null) {

            RemoteMessage.Notification notification = remoteMessage.getNotification();

            if (show && notification != null) {
                String channelId = "notifications";
                int notificationId = (int) SystemClock.uptimeMillis();


                Intent intent = new Intent(this.context, NotificationActionReceiver.class);
                intent.setAction(this.context.getPackageName() + ".ACTION_NOTIFICATION_OPENED");
                intent.setPackage(this.context.getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);


                intent.putExtras(remoteMessage.toIntent());
                intent.putExtra("notificationId", notificationId);


                PendingIntent pendingActionIntent = PendingIntent.getBroadcast(this.context, notificationId, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT);


                NotificationCompat.Builder builder = new NotificationCompat.Builder(this.context, channelId)
                        .setSmallIcon(R.drawable.ic_stat_icon_xumm_android_notification)
                        .setContentTitle(notification.getTitle())
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setContentText(notification.getBody())
                        .setContentIntent(pendingActionIntent);


                NotificationManager manager = (NotificationManager) this.context.getSystemService(this.context.NOTIFICATION_SERVICE);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    builder.setCategory(NotificationCompat.CATEGORY_CALL);

                    builder.setColor(this.context.getResources().getColor(R.color.pushIcon));
                }


                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel channel = new NotificationChannel(channelId, "Notification channel", NotificationManager.IMPORTANCE_DEFAULT);
                    manager.createNotificationChannel(channel);
                }


                manager.notify(remoteMessage.getCollapseKey(), notificationId, builder.build());

            }

            // remove the notification
            NotificationMessageReceiver.notifications.remove(handlerKey);
        }
    }

    @ReactMethod
    public void getBadge(Promise promise) {
        int badge = sharedPreferences.getInt(BADGE_KEY, 0);
        promise.resolve(badge);
    }

    @ReactMethod
    public void setBadge(int badge, Promise promise) {
        sharedPreferences
                .edit()
                .putInt(BADGE_KEY, badge)
                .apply();
        if (badge == 0) {
            ShortcutBadger.removeCount(this.getReactApplicationContext());
        } else {
            ShortcutBadger.applyCount(this.getReactApplicationContext(), badge);
        }
        promise.resolve(null);
    }

}