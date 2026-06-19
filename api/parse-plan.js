// Vercel 서버리스 함수 — 학교 주간학습계획표(사진/PDF)를 Claude 비전으로 읽어
// 시간표 블록 + 요일별 준비물·참고사항으로 구조화해 돌려준다.
// 필요한 환경변수: ANTHROPIC_API_KEY (Vercel 프로젝트 설정에 등록)
import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

// 모델은 환경변수로 바꿀 수 있게 (기본: 최신 Opus). 비용을 줄이려면 claude-sonnet-4-6.
const MODEL = process.env.TIMEJIG_PARSE_MODEL || 'claude-opus-4-8';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    weekRange: { type: 'string', enum: ['mon-fri', 'mon-sat', 'mon-sun'] },
    days: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          day: { type: 'string', enum: ['월', '화', '수', '목', '금', '토', '일'] },
          periods: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                period: { type: 'integer' },
                subject: { type: 'string' },
                start: { type: 'string' },
                end: { type: 'string' },
              },
              required: ['period', 'subject', 'start', 'end'],
            },
          },
          supplies: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['day', 'periods', 'supplies', 'notes'],
      },
    },
  },
  required: ['weekRange', 'days'],
};

const PROMPT = `이 이미지는 어떤 형태든 "시간표"입니다(학교 주간학습계획표, 학원 시간표, 직접 만든 표 등). 표를 읽어 아래 규칙대로 구조화하세요.

- 요일별로 각 칸(교시/시간대)의 과목·수업명을 추출합니다. day 는 '월','화','수','목','금','토','일' 한 글자로.
- 각 항목에 start/end 시각을 "HH:MM"(24시간제)으로 채웁니다. 표에 시각이 적혀 있으면 그대로 쓰고, 없을 때만 합리적으로 추정하세요(학교 표는 1교시 09:00~09:40·쉬는시간 10분·4교시 후 점심 약 50분 같은 표준, 학원/오후 표는 표에 보이는 시간대 기준). period 는 위에서부터 1,2,3… 순서(정수).
- supplies: 그 요일의 준비물이 있으면 한 줄로 정리(없으면 빈 문자열).
- notes: 그 요일의 알림/안내/참고/숙제 등이 있으면 한 줄로 정리(없으면 빈 문자열).
- 표에 등장하는 요일만 days 에 포함하세요. weekRange 는 등장한 요일에 맞춰 mon-fri / mon-sat / mon-sun 중 하나.
- 과목명이 불명확하면 보이는 그대로의 이름으로 넣되, 정말 비어 있으면 그 칸은 건너뜁니다.
- 표에서 읽을 수 없으면 추측으로 지어내지 말고 비워 두세요.`;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 지원해요.' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: '서버에 ANTHROPIC_API_KEY가 설정되지 않았어요. Vercel 환경변수에 등록해 주세요.' });
    return;
  }

  let body;
  try { body = await readBody(req); }
  catch { res.status(400).json({ error: '요청을 읽지 못했어요.' }); return; }

  const { fileType, mediaType, data } = body || {};
  if (!data || !fileType) {
    res.status(400).json({ error: '파일 데이터가 없어요.' });
    return;
  }

  const source = { type: 'base64', media_type: mediaType, data };
  const fileBlock = fileType === 'pdf'
    ? { type: 'document', source: { ...source, media_type: 'application/pdf' } }
    : { type: 'image', source };

  try {
    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: PROMPT }] }],
    });

    const text = resp.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const parsed = JSON.parse(text);
    res.status(200).json({ ok: true, parsed });
  } catch (err) {
    const status = err?.status || 500;
    res.status(status === 401 || status === 403 ? 500 : status).json({
      error: '계획표를 읽는 중 문제가 생겼어요. 사진이 선명한지 확인하고 다시 시도해 주세요.',
      detail: String(err?.message || err).slice(0, 300),
    });
  }
}
