/**
 * analyze-pro.js — Pro 전용 AI 심층 분석
 * POST /.netlify/functions/analyze-pro
 * Header: X-Pro-Key: <gumroad-license-key>
 */

exports.handler = async function (event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Pro-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  // ── 1. Gumroad 라이선스 키 검증 ──────────────────────────
  const proKey = event.headers['x-pro-key'] || '';

  if (!proKey) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'PRO_REQUIRED', message: 'Pro 멤버십이 필요합니다' }),
    };
  }

  // Gumroad 라이선스 검증
  try {
    const verifyRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: process.env.GUMROAD_PRODUCT_ID || '',
        license_key: proKey,
        increment_uses_count: 'false',
      }).toString(),
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'INVALID_KEY', message: '유효하지 않은 라이선스 키입니다' }),
      };
    }
  } catch (verifyErr) {
    console.warn('Gumroad 검증 실패, 진행:', verifyErr.message);
  }

  // ── 2. Claude AI 심층 분석 ────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };

  try {
    const { domains: baseDomains } = JSON.parse(event.body || '{}');
    if (!baseDomains?.length) return { statusCode: 400, headers, body: JSON.stringify({ error: '도메인 목록 없음' }) };

    const today = new Date().toLocaleDateString('ko-KR');
    const list = baseDomains.map(d => `- ${d.domain} (기본점수: ${d.score}, 산업: ${d.industry})`).join('\n');

    const prompt = `도메인 플리핑 전문 AI입니다. 오늘(${today}) 아래 도메인을 심층 분석하세요.

${list}

각 도메인에 대해 분석하고 순수 JSON 배열만 반환 (마크다운 없음):
[
  {
    "domain": "example.com",
    "aiScore": 91,
    "profitPotential": "높음",
    "targetBuyers": "AI 스타트업, SaaS 기업",
    "riskLevel": "낮음",
    "riskNote": "상표권 충돌 없음",
    "sellStrategy": "Sedo 경매 또는 직접 스타트업 접촉 추천",
    "detailedReason": "AI 트렌드와 정확히 부합. 5자 이내 짧은 이름으로 브랜드 가치 높음.",
    "estValueAI": "$800~$4,000",
    "timeToSell": "1~3개월"
  }
]
정확히 ${baseDomains.length}개 반환.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || `HTTP ${response.status}`);

    const raw = data.content.map(i => i.text || '').join('');
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const aiResults = JSON.parse(jsonMatch[0]);

    const merged = baseDomains.map(base => ({
      ...base,
      ...(aiResults.find(a => a.domain === base.domain) || {}),
      hasAIAnalysis: true,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ domains: merged, analyzedAt: new Date().toISOString() }),
    };

  } catch (err) {
    console.error('analyze-pro error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
