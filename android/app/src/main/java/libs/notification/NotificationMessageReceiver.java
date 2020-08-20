package libs.notification;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.ActivityManager;
import android.app.ActivityManager.RunningAppProcessInfo;

import com.google.firebase.messaging.RemoteMessage;

import java.util.HashMap;
import java.util.List;

public class NotificationMessageReceiver extends BroadcastReceiver {
    static HashMap<String, RemoteMessage> notifications = new HashMap<>();

    private boolean isApplicationInForeground(Context context) {
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        List<RunningAppProcessInfo> processInfos = activityManager.getRunningAppProcesses();
        if (processInfos != null) {
            for (RunningAppProcessInfo processInfo : processInfos) {
                if (processInfo.processName.equals(context.getPackageName())
                        && processInfo.importance == RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                        && processInfo.pkgList.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }


    @Override
    public void onReceive(Context context, Intent intent) {

        RemoteMessage remoteMessage = new RemoteMessage(intent.getExtras());

        // store the message for further process
        if (isApplicationInForeground(context)) {
            notifications.put(remoteMessage.getMessageId(), remoteMessage);
        }

    }
}