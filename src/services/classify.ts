export type ClassifyResult = {
  important: boolean;
  reason: string;
  source: 'ai' | 'keyword';
};

const IMPORTANT_KW = [
  '마감', '제출', '발표', '계약', '회의', '미팅', '보고서', '면접', '출장', '프레젠테이션',
  '병원', '수술', '치료', '처방', '진료', '건강검진', '응급',
  '세금', '결제', '청구서', '납부', '월세', '공과금', '카드대금', '송금', '대출',
  '서류', '계약서', '서명', '신청서', '등록', '갱신', '허가', '면허',
  '과제', '시험', '논문', '수강',
];

const NOT_IMPORTANT_KW = [
  '영화', '드라마', '게임', '유튜브', '넷플릭스', '쇼핑', '구매', '주문',
  '청소', '정리', '구경', '산책', '취미', '독서',
];

function keywordClassify(title: string, desc?: string): ClassifyResult {
  const text = (title + ' ' + (desc || '')).toLowerCase();
  const importantHit = IMPORTANT_KW.find(k => text.includes(k));
  const notImportantHit = NOT_IMPORTANT_KW.find(k => text.includes(k));
  if (importantHit) return { important: true, reason: `${importantHit} 관련`, source: 'keyword' };
  if (notImportantHit) return { important: false, reason: `${notImportantHit} 관련`, source: 'keyword' };
  return { important: true, reason: '기본 분류', source: 'keyword' };
}

export async function classifyTodo(title: string, description?: string): Promise<ClassifyResult> {
  if (!title.trim()) return { important: true, reason: '', source: 'keyword' };

  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) return keywordClassify(title, description);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{
          role: 'user',
          content: `할 일: "${title}"${description ? ` (${description})` : ''}

중요도 판단:
- 중요(true): 업무마감·건강·재정납부·계약·법적의무·타인영향
- 덜중요(false): 취미·선택적구매·일상소소·언제해도되는일

JSON만 출력: {"important":true,"reason":"10자이내이유"}`
        }]
      })
    });

    if (!res.ok) throw new Error('api_error');
    const data = await res.json();
    const text: string = data.content?.[0]?.text || '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) throw new Error('parse_error');
    const parsed = JSON.parse(match[0]);
    return {
      important: Boolean(parsed.important),
      reason: String(parsed.reason || ''),
      source: 'ai',
    };
  } catch {
    return keywordClassify(title, description);
  }
}
