package extentions;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class PerformanceLogger {
    private final String tag;
    private String method;
    private long startTime;
    private boolean started;
    private boolean ended;
    private JSONObject report;

    public PerformanceLogger(final String tagName) {
        tag = tagName;

        try {
            JSONObject reportObject = new JSONObject();
            reportObject.put("TAG", tag);
            report = reportObject;
        } catch (JSONException e) {
            Log.e(tag, "Performance logger Unable to init report object");
        }
    }

    public void start(final String methodName) {
        if (started && !ended) {
            throw new RuntimeException("Performance logger already started, stop first!");
        }

        started = true;
        ended = false;
        method = methodName;
        startTime = System.currentTimeMillis();
    }

    public void end(final String methodName) {
        try {
            if (!started) {
                throw new RuntimeException("Performance logger is not started!");
            }

            if (!method.equals(methodName)) {
                throw new RuntimeException("Performance logger tries to stop unknown method!");
            }

            started = false;
            ended = true;


            // add to the report
            report.put(method, System.currentTimeMillis() - startTime);
        } catch (JSONException e) {
            Log.e(tag, "Performance logger Unable to end the report");
        }
    }

    public void log() {
        Log.d(tag, report.toString());
    }
}
