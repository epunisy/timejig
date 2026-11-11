package com.timejig.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * 홈 화면 위젯 — 오늘 요일의 시간표를 보여주고, 지금 진행 중인 수업을 강조한다.
 * 데이터는 웹앱이 WidgetPlugin 으로 넘겨준 JSON:
 * { "name": "시간표 이름", "days": { "월": [ { "s": 540, "e": 600, "n": "수학", "c": "#F5B0C6" } ] } }
 * (s/e = 자정 기준 분)
 */
public class TimetableWidget extends AppWidgetProvider {
    static final String PREFS = "timejig_widget";
    static final String KEY_DATA = "data";
    private static final String[] DAYS = { "일", "월", "화", "수", "목", "금", "토" };
    private static final int MAX_ROWS = 10;

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) render(ctx, mgr, id);
        scheduleNext(ctx);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int id, Bundle opts) {
        render(ctx, mgr, id);
    }

    @Override
    public void onDisabled(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(refreshIntent(ctx));
    }

    static void updateAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, TimetableWidget.class));
        for (int id : ids) render(ctx, mgr, id);
        if (ids.length > 0) scheduleNext(ctx);
    }

    private static class Item {
        int s, e, c;
        String n;
    }

    /** 오늘 요일의 블록 목록. 저장된 데이터가 없으면 null. */
    private static List<Item> todayItems(Context ctx, String[] nameOut) {
        String raw = ctx.getSharedPreferences(PREFS, 0).getString(KEY_DATA, null);
        if (raw == null) return null;
        List<Item> list = new ArrayList<>();
        try {
            JSONObject o = new JSONObject(raw);
            nameOut[0] = o.optString("name", "");
            String today = DAYS[Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1];
            JSONObject days = o.optJSONObject("days");
            JSONArray arr = days == null ? null : days.optJSONArray(today);
            if (arr != null) {
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject b = arr.getJSONObject(i);
                    Item it = new Item();
                    it.s = b.getInt("s");
                    it.e = b.getInt("e");
                    it.n = b.optString("n", "");
                    try {
                        it.c = Color.parseColor(b.optString("c", "#C4C9D0"));
                    } catch (Exception ex) {
                        it.c = 0xFFC4C9D0;
                    }
                    list.add(it);
                }
            }
        } catch (Exception ex) {
            return null;
        }
        Collections.sort(list, (a, b) -> a.s - b.s);
        return list;
    }

    private static String hm(int min) {
        return String.format(Locale.US, "%d:%02d", min / 60, min % 60);
    }

    private static int nowMin() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
    }

    static void render(Context ctx, AppWidgetManager mgr, int id) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_timetable);
        String today = DAYS[Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1];
        v.setTextViewText(R.id.w_title, "오늘 · " + today + "요일");

        String[] name = { "" };
        List<Item> items = todayItems(ctx, name);
        v.setTextViewText(R.id.w_ttname, name[0]);
        v.removeAllViews(R.id.w_rows);

        if (items == null) {
            v.setTextViewText(R.id.w_empty, "앱을 한 번 열면 시간표가 나타나요");
            v.setViewVisibility(R.id.w_empty, View.VISIBLE);
        } else if (items.isEmpty()) {
            v.setTextViewText(R.id.w_empty, "오늘은 일정이 없어요 🙌");
            v.setViewVisibility(R.id.w_empty, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.w_empty, View.GONE);
            int now = nowMin();
            // 지난 수업이 많으면 위쪽을 건너뛰어 지금·다음 수업이 보이게 (지난 것 1개는 남김)
            int first = 0;
            while (first < items.size() && items.get(first).e <= now) first++;
            first = Math.max(0, Math.min(first - 1, items.size() - MAX_ROWS));
            for (int i = first; i < items.size() && i < first + MAX_ROWS; i++) {
                Item it = items.get(i);
                RemoteViews row = new RemoteViews(ctx.getPackageName(), R.layout.widget_row);
                boolean cur = it.s <= now && now < it.e;
                boolean past = it.e <= now;
                row.setInt(R.id.r_bar, "setBackgroundColor", it.c);
                row.setTextViewText(R.id.r_time, hm(it.s) + "–" + hm(it.e));
                row.setTextViewText(R.id.r_name, it.n);
                if (cur) {
                    row.setTextColor(R.id.r_name, 0xFFE5484D);
                    row.setTextColor(R.id.r_time, 0xFFE5484D);
                    row.setViewVisibility(R.id.r_now, View.VISIBLE);
                    row.setInt(R.id.r_root, "setBackgroundResource", R.drawable.widget_row_now);
                } else if (past) {
                    row.setTextColor(R.id.r_name, 0xFFB5BAC1);
                    row.setTextColor(R.id.r_time, 0xFFC9CDD3);
                    row.setInt(R.id.r_bar, "setBackgroundColor", 0xFFE4E7EB);
                }
                v.addView(R.id.w_rows, row);
            }
        }

        // 위젯을 누르면 앱 열기
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, pi);

        mgr.updateAppWidget(id, v);
    }

    private static PendingIntent refreshIntent(Context ctx) {
        Intent i = new Intent(ctx, TimetableWidget.class);
        i.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(ctx)
            .getAppWidgetIds(new ComponentName(ctx, TimetableWidget.class));
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        return PendingIntent.getBroadcast(ctx, 1, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** 다음 수업 시작/끝 또는 자정에 맞춰 다시 그리도록 예약 ('지금' 표시·요일 갱신용). */
    private static void scheduleNext(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        int now = nowMin();
        int next = 24 * 60; // 자정
        List<Item> items = todayItems(ctx, new String[] { "" });
        if (items != null) {
            for (Item it : items) {
                if (it.s > now && it.s < next) next = it.s;
                if (it.e > now && it.e < next) next = it.e;
            }
        }
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 5);
        c.set(Calendar.MILLISECOND, 0);
        c.add(Calendar.MINUTE, next);
        am.set(AlarmManager.RTC, c.getTimeInMillis(), refreshIntent(ctx));
    }
}
