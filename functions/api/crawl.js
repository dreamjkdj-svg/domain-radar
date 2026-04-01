/**
 * crawl.js — Cloudflare Pages Function
 * GET /api/crawl  또는  Cron 트리거
 */

const TREND_KEYWORDS = [
  { words: ['ai', 'gpt', 'llm', 'ml', 'bot', 'auto', 'smart'], score: 18 },
  { words: ['saas', 'api', 'dev', 'code', 'app', 'cloud', 'stack'], score: 14 },
  { words: ['pay', 'fund', 'bank', 'fin', 'coin', 'trade', 'invest'], score: 13 },
  { words: ['health', 'care', 'med', 'fit', 'well', 'clinic'], score: 12 },
  { words: ['studio', 'create', 'media', 'content', 'stream', 'pod'], score: 11 },
  { words: ['green', 'eco', 'solar', 'clean', 'sustain'], score: 10 },
];

const TLD_SCORES = {
  '.com': 20, '.io': 16, '.ai': 18, '.co': 12,
  '.net': 8, '.app': 10, '.dev': 10, '.xyz': 4,
};

const PARTNER_LINKS = {
  domestic: [
    { name: '가비아', url: 'https://www.gabia.com/?utm_source=domainradar' },
    { name: '카페24', url: 'https://hosting.cafe24.com/?utm_source=domainradar' },
  ],
  global: [
    { name: 'Namecheap', url: 'https://www.namecheap.com/?aff=domainradar' },
    { name: 'Hostinger', url: 'https://www.hostinger.com/?utm_source=domainradar' },
  ],
};

function scoreDomain(domain) {
  const lower = domain.toLowerCase();
  const tldMatch = lower.match(/(\.[a-z]+)$/);
  if (!tldMatch) return null;
  const tld = tldMatch[1];
  const sld = lower.replace(tld, '');
  let score = TLD_SCORES[tld] || 2;
  let industry = '기타';
  let tags = [];

  for (const { words, score: s } of TREND_KEYWORDS) {
    for (const w of words) {
      if (sld.includes(w)) {
        score += s;
        tags.push(w);
        if (words.includes('ai') || words.includes('gpt')) industry = 'AI/테크';
        else if (words.includes('pay') || words.includes('fin')) industry = '핀테크';
        else if (words.includes('health')) industry = '헬스케어';
        else if (words.includes('saas')) industry = 'SaaS';
        break;
      }
    }
  }

  if (sld.length <= 5) score += 15;
  else if (sld.length <= 8) score += 8;
  if (/^[a-z]+$/.test(sld)) score += 5;

  return {
    domain,
    score: Math.min(score, 99),
    industry: industry || '기타',
    tags: tags.slice(0, 3),
    tld,
    partners: PARTNER_LINKS,
  };
}

function generateDomains() {
  const prefixes = ['ai','nova','flux','zeta','apex','sync','byte','core','mesh','edge',
    'meta','loop','flow','hub','lux','arc','dash','peak','sky','zen',
    'grid','link','mind','neo','ops','pro','run','set','tag','uni'];
  const suffixes = ['lab','io','ai','tech','hq','co','app','dev','run','hub',
    'ly','fy','zy','st','ex','ix','ax','ox','ux','us'];
  const tlds = ['.com','.io','.ai','.co','.app','.dev'];

  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  const rand = (n, s) => (seed * (s+1) * 2654435761 >>> 0) % n;

  const domains = [];
  const used = new Set();
  let attempts = 0;

  while (domains.length < 20 && attempts < 200) {
    attempts++;
    const i = rand(prefixes.length, attempts);
    const j = rand(suffixes.length, attempts * 3);
    const k = rand(tlds.length, attempts * 7);
    const domain = `${prefixes[i]}${suffixes[j]}${tlds[k]}`;
    if (used.has(domain)) continue;
    used.add(domain);
    const scored = scoreDomain(domain);
    if (scored && scored.score >= 20) domains.push(scored);
  }

  return domains.sort((a, b) => b.score - a.score).slice(0, 12);
}

// Cloudflare Pages Functions 형식
export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const domains = generateDomains();
    return new Response(JSON.stringify({
      domains,
      generatedAt: new Date().toISOString(),
      count: domains.length,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

// Cron 트리거용 (scheduled)
export async function scheduled(event, env, ctx) {
  console.log('Cron crawl triggered:', new Date().toISOString());
  // KV에 저장하려면 env.DOMAIN_CACHE.put(...) 사용 가능
}
