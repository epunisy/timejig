package com.timejig.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** 웹앱이 시간표가 바뀔 때마다 호출 — 위젯용 데이터를 저장하고 위젯을 다시 그린다. */
@CapacitorPlugin(name = "TimejigWidget")
public class WidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("data is missing");
            return;
        }
        getContext().getSharedPreferences(TimetableWidget.PREFS, 0)
            .edit().putString(TimetableWidget.KEY_DATA, data).apply();
        TimetableWidget.updateAll(getContext());
        call.resolve();
    }
}
