package com.timejig.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 웹앱 → 홈 화면 위젯으로 시간표를 넘겨주는 브리지
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
