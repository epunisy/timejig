// 안드로이드 앱(Capacitor)에서만 — 홈 화면 위젯에 현재 시간표를 넘겨준다.
// 웹/PWA 에서는 아무 일도 하지 않는다.
import { Capacitor, registerPlugin } from '@capacitor/core';

const TimejigWidget = registerPlugin('TimejigWidget');

let timer = null;
let lastSent = '';

// data: 앱 전체 데이터, colorOf(config, subject) → '#RRGGBB' | null
export function syncWidget(data, colorOf) {
  if (!Capacitor.isNativePlatform() || !data) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const tt = (data.timetables || []).find(t => t.id === data.activeTT);
    if (!tt) return;
    const config = tt.config || data.config || {};
    const base = (config.startHour || 0) * 60; // 블록 start/end 는 startHour 기준 분
    const subjects = {};
    (data.subjects || []).forEach(s => { subjects[s.id] = s; });

    const days = {};
    (tt.blocks || []).forEach(b => {
      const s = subjects[b.subjectId];
      if (!s) return;
      (days[b.day] = days[b.day] || []).push({
        s: base + b.start,
        e: base + b.end,
        n: s.name,
        c: colorOf(config, s) || '#C4C9D0',
      });
    });

    const payload = JSON.stringify({ name: tt.name, days });
    if (payload === lastSent) return;
    lastSent = payload;
    TimejigWidget.update({ data: payload }).catch(() => { /* 위젯 미지원 기기 등 — 무시 */ });
  }, 400);
}
