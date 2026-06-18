# 타임지그 (TimeJig)

## 주간학습계획표 자동 입력 (AI)

`api/parse-plan.js` (Vercel 서버리스 함수)가 학교 주간학습계획표 사진/PDF를 Claude 비전으로 읽어
시간표 블록과 요일별 준비물·참고사항으로 구조화합니다.

**필수 환경변수 (Vercel 프로젝트 설정 → Environment Variables):**

- `ANTHROPIC_API_KEY` — Anthropic API 키 (필수)
- `TIMEJIG_PARSE_MODEL` — (선택) 사용할 모델. 기본 `claude-opus-4-8`. 비용을 줄이려면 `claude-sonnet-4-6`.

키를 등록한 뒤 재배포해야 기능이 동작합니다. 스캔 1회당 소액의 API 비용이 발생합니다.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
