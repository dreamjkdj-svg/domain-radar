/**
 * worker.js — 메인 라우터
 * /api/crawl → crawl 핸들러
 * /api/analyze-pro → analyze-pro 핸들러
 * 나머지 → 정적 파일 (index.html)
 */

import { onRequest as crawlHandler } from './functions/api/crawl.js';
import { onRequest as analyzeProHandler } from './functions/api/analyze-pro.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API 라우팅
    if (path === '/api/crawl') {
      return crawlHandler({ request, env, ctx });
    }

    if (path === '/api/analyze-pro') {
      return analyzeProHandler({ request, env, ctx });
    }

    // 정적 파일 서빙
    return env.ASSETS.fetch(request);
  }
};
